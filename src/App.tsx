import { useState, useEffect, useRef, useMemo } from "react";
import { DataTable, type DataTableStateEvent } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { InputNumber } from "primereact/inputnumber";
import { fetchArtworks, type Artwork } from "./services/api";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export default function App() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [first, setFirst] = useState(0);
  const rowsPerPage = 12;

  const [manualMap, setManualMap] = useState<Record<number, boolean>>({});
  const [bulkLimit, setBulkLimit] = useState<number>(0);

  const [inputVal, setInputVal] = useState<number | null>(null);
  const op = useRef<OverlayPanel>(null);

  const loadData = async (pageIndex: number) => {
    setLoading(true);
    try {
      const response = await fetchArtworks(pageIndex + 1);
      setArtworks(response.data);
      setTotalRecords(response.pagination.total);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(first / rowsPerPage);
  }, [first]);

  const pageSelection = useMemo(() => {
    return artworks.filter((art, index) => {
      const globalIdx = first + index + 1;
      const manual = manualMap[art.id];

      if (manual !== undefined) return manual;
      return globalIdx <= bulkLimit;
    });
  }, [artworks, manualMap, bulkLimit, first]);

  const totalCountLabel = useMemo(() => {
    const manualAdds = Object.values(manualMap).filter(
      (v) => v === true,
    ).length;
    const manualRemoves = Object.values(manualMap).filter(
      (v) => v === false,
    ).length;
    return Math.max(0, bulkLimit + manualAdds - manualRemoves);
  }, [bulkLimit, manualMap]);

  const onSelectChange = (e: { value: Artwork[] }) => {
    const newPageSelection = e.value;
    const updatedMap = { ...manualMap };

    artworks.forEach((art, index) => {
      const isSelected = newPageSelection.some((item) => item.id === art.id);
      const isInsideBulk = first + index + 1 <= bulkLimit;

      if (isSelected !== isInsideBulk) {
        updatedMap[art.id] = isSelected;
      } else {
        delete updatedMap[art.id];
      }
    });

    setManualMap(updatedMap);
  };

  const submitBulk = () => {
    if (inputVal !== null) {
      setBulkLimit(inputVal);
      setManualMap({});
      op.current?.hide();
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <div
        style={{ marginBottom: "10px", fontSize: "1.25rem", fontWeight: "700" }}
      >
        Selected: {totalCountLabel} rows
      </div>

      <DataTable
        value={artworks}
        lazy
        paginator
        first={first}
        rows={rowsPerPage}
        totalRecords={totalRecords}
        onPage={(e: DataTableStateEvent) => setFirst(e.first)}
        loading={loading}
        dataKey="id"
        selectionMode="multiple"
        selection={pageSelection}
        onSelectionChange={onSelectChange}
        showGridlines
      >
        <Column
          selectionMode="multiple"
          headerStyle={{ width: "6rem" }}
          header={
            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <i
                className="pi pi-chevron-down"
                style={{
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  color: "#334155",
                }}
                onClick={(e) => op.current?.toggle(e)}
              />
              <OverlayPanel ref={op} className="custom-selection-panel">
                <div style={{ padding: "4px", width: "240px" }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "0.95rem" }}>
                    Select Multiple Rows
                  </h4>
                  <p
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: "0.75rem",
                      color: "#64748b",
                    }}
                  >
                    Enter number of rows to select across all pages
                  </p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <InputNumber
                      value={inputVal}
                      onValueChange={(e) => setInputVal(e.value ?? 0)}
                      placeholder="e.g. 20"
                      min={0}
                      className="p-inputtext-sm"
                    />
                    <Button
                      label="Select"
                      onClick={submitBulk}
                      className="p-button-sm"
                    />
                  </div>
                </div>
              </OverlayPanel>
            </div>
          }
        />
        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Date" />
        <Column field="date_end" header="End Date" />
      </DataTable>
    </div>
  );
}
