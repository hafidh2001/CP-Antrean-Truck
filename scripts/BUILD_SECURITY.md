# Build Security Notes

## Warning tentang SECRET di ARG/ENV

Docker memberikan warning karena menggunakan `VITE_DECRYPT_SECRET_KEY` di ARG/ENV. Ini terjadi karena:
- Docker mendeteksi kata "SECRET" dan memberikan warning otomatis
- Vite HARUS memiliki environment variables saat BUILD TIME (bukan runtime)

## Opsi Mitigasi:

### Opsi 1: Rename Variable (Rekomen untuk menghilangkan warning)
Ganti nama variable untuk menghindari warning:
- `VITE_DECRYPT_SECRET_KEY` → `VITE_DECRYPT_KEY` atau `VITE_CIPHER_KEY`

### Opsi 2: Gunakan Build Secret (Lebih aman tapi kompleks)
```dockerfile
# Gunakan --secret saat build
RUN --mount=type=secret,id=decrypt_key \
    VITE_DECRYPT_SECRET_KEY=$(cat /run/secrets/decrypt_key) npm run build
```

Build command:
```bash
docker build --secret id=decrypt_key,src=.env.decrypt .
```

### Opsi 3: Multi-stage Build dengan Cleanup
Sudah diterapkan - builder stage dihapus, hanya nginx yang remain.

## Kesimpulan

Untuk aplikasi frontend dengan Vite:
- Warning ini NORMAL dan expected
- Secret akan ter-embed di bundle JavaScript (by design)
- Yang penting: Jangan gunakan secret yang sama dengan backend/database
- Gunakan secret yang khusus untuk decrypt frontend saja

## Best Practices

1. **Gunakan secret berbeda untuk setiap environment**
   - Development: secret dev
   - Staging: secret staging  
   - Production: secret production

2. **Rotate secret secara berkala**

3. **Jangan commit .env ke repository**

4. **Monitor akses ke decrypt endpoint**