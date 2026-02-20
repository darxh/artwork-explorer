import { useState, useEffect, useRef } from "react";
import {
  DataTable,
  type DataTableStateEvent,
  type DataTableSelectionMultipleChangeEvent,
} from "primereact/datatable";
import { Column } from "primereact/column";
import { fetchArtworks, type Artwork } from "./services/api";
import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";

import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export default function App() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [first, setFirst] = useState(0);

  const [rowSelection, setRowSelection] = useState<Record<number, boolean>>({});

  const op = useRef<OverlayPanel>(null);
  const [numRowsToSelect, setNumRowsToSelect] = useState<number>(0);

  const [pendingSelections, setPendingSelections] = useState<
    Record<number, number>
  >({});

  const totalPending = Object.values(pendingSelections).reduce(
    (sum, val) => sum + val,
    0,
  );
  const totalSelected = Object.keys(rowSelection).length + totalPending;

  const loadArtworks = async (pageIndex: number) => {
    setLoading(true);
    try {
      const response = await fetchArtworks(pageIndex + 1);

      setArtworks(response.data);
      setTotalRecords(response.pagination.total);

      setPendingSelections((prevPending) => {
        if (prevPending[pageIndex]) {
          const take = prevPending[pageIndex];

          setRowSelection((prevRow) => {
            const updated = { ...prevRow };
            for (let i = 0; i < take && i < response.data.length; i++) {
              updated[response.data[i].id] = true;
            }
            return updated;
          });

          const updatedPending = { ...prevPending };
          delete updatedPending[pageIndex];
          return updatedPending;
        }
        return prevPending;
      });
    } catch (error) {
      console.error("Failed to load artworks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const pageIndex = first / 12;
    loadArtworks(pageIndex);
  }, [first]);

  const onPageChange = (event: DataTableStateEvent) => {
    setFirst(event.first);
  };

  const onSelectionChange = (
    event: DataTableSelectionMultipleChangeEvent<Artwork[]>,
  ) => {
    const currentSelected = event.value;
    const currentSelectedIds = new Set(currentSelected.map((art) => art.id));

    setRowSelection((prev) => {
      const updated = { ...prev };
      artworks.forEach((art) => {
        if (currentSelectedIds.has(art.id)) {
          updated[art.id] = true;
        } else {
          delete updated[art.id];
        }
      });
      return updated;
    });
  };

  const handleCustomSelect = () => {
    const count = numRowsToSelect || 0;

    const newSelection: Record<number, boolean> = {};
    const newPending: Record<number, number> = {};

    let remaining = count;
    let pIndex = 0;

    while (remaining > 0) {
      const take = Math.min(remaining, 12);
      newPending[pIndex] = take;
      remaining -= take;
      pIndex++;
    }

    const currentPageIndex = first / 12;
    if (newPending[currentPageIndex] && artworks.length > 0) {
      const take = newPending[currentPageIndex];
      for (let i = 0; i < take && i < artworks.length; i++) {
        newSelection[artworks[i].id] = true;
      }
      delete newPending[currentPageIndex];
    }

    setRowSelection(newSelection);
    setPendingSelections(newPending);
    op.current?.hide();
  };

  const tableHeader = (
    <div style={{ padding: "0.5rem 0", fontWeight: "500" }}>
      Selected: {totalSelected} rows
    </div>
  );

  const titleHeader = (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <i
        className="pi pi-chevron-down"
        style={{ cursor: "pointer", fontSize: "0.8rem" }}
        onClick={(e) => op.current?.toggle(e)}
      ></i>
      <span>Title</span>
    </div>
  );

  return (
    <div style={{ padding: "2rem" }}>
      <OverlayPanel ref={op}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="number"
            placeholder="Select rows..."
            onChange={(e) => setNumRowsToSelect(Number(e.target.value))}
            style={{
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              outline: "none",
            }}
          />
          <Button label="Submit" onClick={handleCustomSelect} size="small" />
        </div>
      </OverlayPanel>

      <DataTable
        header={tableHeader}
        value={artworks}
        lazy
        paginator
        first={first}
        rows={12}
        totalRecords={totalRecords}
        onPage={onPageChange}
        loading={loading}
        dataKey="id"
        selectionMode="multiple"
        selection={artworks.filter((art) => rowSelection[art.id])}
        onSelectionChange={onSelectionChange}
      >
        <Column
          selectionMode="multiple"
          headerStyle={{ width: "3rem" }}
        ></Column>
        <Column field="title" header={titleHeader} />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Date" />
        <Column field="date_end" header="End Date" />
      </DataTable>
    </div>
  );
}
