namespace istockBack.Services
{
    public interface ITokenService
    {
        string GenerateToken(Usuario usuario);
    }
}