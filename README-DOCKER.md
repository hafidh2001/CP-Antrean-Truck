# Docker Setup untuk CP-Antrean-Truck

Project ini telah dikonfigurasi untuk berjalan di Docker dengan dukungan multi-architecture (AMD64 dan ARM64).

## File Docker yang Tersedia

1. **Dockerfile** - Multi-stage build untuk production
2. **docker-compose.yml** - Untuk development dan production
3. **.dockerignore** - Mengexclude file yang tidak diperlukan
4. **nginx.conf** - Konfigurasi nginx untuk serving React app
5. **Scripts** - Build dan push scripts untuk setiap architecture

## Cara Penggunaan

### Development dengan Docker Compose

```bash
# Menjalankan development server
docker-compose --profile dev up

# Menjalankan dalam background
docker-compose --profile dev up -d

# Melihat logs
docker-compose logs -f dev

# Menghentikan container
docker-compose --profile dev down

# Akses aplikasi di http://localhost:5173
```

### Production dengan Docker Compose

```bash
# Build dan jalankan production container
docker-compose up -d

# Rebuild image jika ada perubahan
docker-compose up -d --build

# Melihat logs
docker-compose logs -f app

# Menghentikan container
docker-compose down

# Akses aplikasi di http://localhost:8080
```

### Build untuk Production

#### Build untuk AMD64
```bash
./scripts/build-amd64.sh
```

#### Build untuk ARM64
```bash
./scripts/build-arm64.sh
```

#### Build untuk Semua Architecture (Recommended)
```bash
./scripts/build-all.sh
```

### Push ke Docker Hub

#### Push AMD64
```bash
./scripts/push-amd64.sh
```

#### Push ARM64
```bash
./scripts/push-arm64.sh
```

#### Push Semua Architecture (via build-all.sh)
Script `build-all.sh` akan otomatis push ke Docker Hub.

### Menjalankan Container

```bash
# Untuk AMD64
docker run -d -p 8080:80 hafidh2001/cp-antrean-truck:amd64

# Untuk ARM64
docker run -d -p 8080:80 hafidh2001/cp-antrean-truck:arm64

# Untuk auto-detect architecture
docker run -d -p 8080:80 hafidh2001/cp-antrean-truck:latest
```

### Docker Hub Images

Images tersedia di Docker Hub:
- `hafidh2001/cp-antrean-truck:latest` (multi-arch)
- `hafidh2001/cp-antrean-truck:amd64`
- `hafidh2001/cp-antrean-truck:arm64`

## Quick Start Commands

```bash
# 1. Setup buildx untuk multi-arch (jalankan sekali saja)
docker buildx create --name multiarch-builder --use
docker buildx inspect --bootstrap

# 2. Login ke Docker Hub
docker login

# 3. Build dan push semua architecture sekaligus
./scripts/build-all.sh

# Atau build individual:
# - Build AMD64: ./scripts/build-amd64.sh
# - Build ARM64: ./scripts/build-arm64.sh
# - Push AMD64: ./scripts/push-amd64.sh
# - Push ARM64: ./scripts/push-arm64.sh

# 4. Pull dan jalankan dari Docker Hub
docker pull hafidh2001/cp-antrean-truck:latest
docker run -d -p 8080:80 hafidh2001/cp-antrean-truck:latest
```

## Development Workflow

```bash
# 1. Clone repository
git clone <repository-url>
cd CP-Antrean-Truck

# 2. Jalankan development server dengan Docker
docker-compose --profile dev up

# 3. Buka browser ke http://localhost:5173

# 4. Untuk production build
docker-compose up -d --build

# 5. Buka browser ke http://localhost:8080
```

## Troubleshooting

```bash
# Jika ada masalah dengan buildx
docker buildx rm multiarch-builder
docker buildx create --name multiarch-builder --use

# Jika port sudah digunakan
docker ps  # cek container yang berjalan
docker stop <container-id>

# Clean up Docker resources
docker system prune -a

# Melihat logs container
docker logs <container-name>
```

## Prerequisites

1. Docker installed
2. Docker Compose installed
3. Docker buildx enabled untuk multi-arch build
4. Docker Hub account (untuk push)

## Setup Docker Buildx

```bash
# Enable experimental features
docker buildx create --name multiarch-builder --use
docker buildx inspect --bootstrap
```