export interface Artwork {
  id: number;
  title: string;
  place_of_origin: string;
  artist_display: string;
  inscriptions: string;
  date_start: number;
  date_end: number;
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  total_pages: number;
  current_page: number;
}

export interface ApiResponse {
  pagination: Pagination;
  data: Artwork[];
}

export const fetchArtworks = async (page: number): Promise<ApiResponse> => {
  try {
    const response = await fetch(
      `https://api.artic.edu/api/v1/artworks?page=${page}`,
    );

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = await response.json();

    return {
      pagination: data.pagination,
      data: data.data,
    };
  } catch (error) {
    console.error("Error fetching artworks:", error);
    throw error;
  }
};
