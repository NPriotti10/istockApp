namespace istockBack.DTOs
{
    public class PagedResultDto<T>
    {
        public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
        public int Total { get; set; }      // Total de registros sin paginar
        public int Page { get; set; }       // Página actual (1-based)
        public int PageSize { get; set; }   // Tamaño de página
    }
}