# E-Ticaret Projesi

Bu proje, modern web teknolojileri kullanılarak geliştirilmiş kapsamlı bir e-ticaret platformudur. Microservices mimarisi, Docker containerization ve çeşitli modern teknolojiler kullanılarak oluşturulmuştur.

## 🚀 Özellikler

- Kullanıcı kimlik doğrulama ve yetkilendirme
- Ürün arama ve filtreleme (Elasticsearch)
- Alışveriş sepeti yönetimi
- Ödeme işlemleri
- Gerçek zamanlı bildirimler (WebSocket)
- Redis önbellekleme
- Kafka mesaj kuyruğu
- Responsive tasarım

## 🛠 Teknoloji Yığını

### Backend

- Node.js
- Express.js
- MongoDB
- Elasticsearch
- Redis
- Kafka
- WebSocket
- JWT Authentication

### Frontend

- React.js
- Context API
- Axios
- CSS3
- WebSocket Client

### DevOps

- Docker
- Docker Compose
- Microservices Architecture

## 📦 Servisler

1. **Monolith Service (Port: 5000)**

   - Ana uygulama mantığı
   - Ürün yönetimi
   - Kullanıcı yönetimi
   - Sepet işlemleri
   - Elasticsearch entegrasyonu

2. **Payment Service (Port: 5001)**

   - Ödeme işlemleri
   - Ödeme geçmişi
   - Fatura oluşturma

3. **Billing Service (Port: 5002)**

   - Fatura işlemleri
   - Fatura geçmişi

4. **Frontend (Port: 3500)**
   - Kullanıcı arayüzü
   - Responsive tasarım
   - Gerçek zamanlı güncellemeler

## 🔧 Kurulum

1. Projeyi klonlayın:
   \`\`\`bash
   git clone [repo-url]
   cd e-commerce-project
   \`\`\`

2. Docker ve Docker Compose'un yüklü olduğundan emin olun.

3. Ortam değişkenlerini ayarlayın:

   - Her servis için gerekli .env dosyalarını oluşturun
   - Örnek .env dosyaları için .env.example dosyalarını kontrol edin

4. Servisleri başlatın:
   \`\`\`bash
   docker-compose up -d
   \`\`\`

## 📝 API Endpoints

### Auth Endpoints

- \`POST /api/auth/register\` - Yeni kullanıcı kaydı
- \`POST /api/auth/login\` - Kullanıcı girişi
- \`GET /api/auth/verify\` - Token doğrulama

### Product Endpoints

- \`GET /api/products\` - Tüm ürünleri listele
- \`GET /api/products/:id\` - Tek ürün detayı
- \`POST /api/products\` - Yeni ürün ekle (Auth gerekli)
- \`PUT /api/products/:id\` - Ürün güncelle (Auth gerekli)
- \`DELETE /api/products/:id\` - Ürün sil (Auth gerekli)
- \`POST /api/products/search\` - Ürün ara (Elasticsearch)

### Cart Endpoints

- \`GET /api/cart\` - Sepeti görüntüle
- \`POST /api/cart/items\` - Sepete ürün ekle
- \`PUT /api/cart/items/:productId\` - Sepetteki ürün miktarını güncelle
- \`DELETE /api/cart/items/:productId\` - Sepetten ürün kaldır
- \`DELETE /api/cart\` - Sepeti temizle

### Payment Endpoints

- \`POST /api/payments\` - Ödeme işlemi başlat
- \`GET /api/payments/:id\` - Ödeme durumu sorgula

## 🔍 Elasticsearch Özellikleri

- Ürün araması
- Bulanık arama desteği
- Kategori filtreleme
- Fiyat aralığı filtreleme
- Sıralama seçenekleri

## 💾 Redis Önbellekleme

- Ürün listesi önbellekleme
- Arama sonuçları önbellekleme
- Sepet bilgisi önbellekleme

## 📨 Kafka Mesaj Kuyruğu

- Ödeme işlemleri
- Fatura oluşturma
- Stok güncelleme
- Bildirim gönderme

## 🔒 Güvenlik

- JWT tabanlı kimlik doğrulama
- Şifrelenmiş kullanıcı bilgileri
- CORS koruması
- Rate limiting
- Input validasyonu

## 🌐 WebSocket Bildirimleri

- Sipariş durumu güncellemeleri
- Stok değişikliği bildirimleri
- Ödeme durumu güncellemeleri

## 📊 Monitoring

- Elasticsearch durum kontrolü
- Redis bağlantı durumu
- Kafka broker durumu
- Servis sağlık kontrolleri

## 📞 İletişim

Proje Sahibi - [@BigNjapan](https://github.com/BigNjapan) Kadircan Devrim
