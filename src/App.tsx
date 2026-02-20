import { useState, useEffect } from "react";
import {
  DataTable,
  type DataTableStateEvent,
  type DataTableSelectionMultipleChangeEvent,
} from "primereact/datatable";
import { Column } from "primereact/column";
import { fetchArtworks, type Artwork } from "./services/api";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export default function App() {
  const [rowSelection, setRowSelection] = useState<Record<number, boolean>>({});
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [first, setFirst] = useState(0);

  const loadArtworks = async (pageIndex: number) => {
    setLoading(true);
    try {
      const response = await fetchArtworks(pageIndex + 1);
      setArtworks(response.data);
      setTotalRecords(response.pagination.total);
    } catch (error) {
      console.error("failed to load artworks", error);
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

  return (
    <div style={{ padding: "2rem" }}>
      <DataTable
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
