# Generic Shop - E-Commerce Application

Dự án ứng dụng bán hàng Generic Shop bao gồm **Backend (Spring Boot)** và **Frontend (React + Vite)**.

---

## 📋 Yêu Cầu Hệ Thống (Prerequisites)

- **Java**: JDK 17 trở lên
- **Node.js**: Phiên bản 18.x trở lên & **npm**
- **Cơ sở dữ liệu**: MySQL Server (cổng mặc định `3306`)
- **Maven**: (Tùy chọn, dự án đã tích hợp sẵn Maven Wrapper `mvnw`)

---

## 🗄️ Cấu Hình Cơ Sở Dữ Liệu (Database)

1. Khởi động dịch vụ MySQL trên máy tính (XAMPP, MySQL Workbench hoặc MySQL Docker).
2. Kiểm tra hoặc cập nhật thông tin kết nối tại file:  
   `src/main/resources/application.properties`

   ```properties
   spring.jpa.hibernate.ddl-auto=update
   spring.datasource.url=jdbc:mysql://localhost:3306/generic_shop?createDatabaseIfNotExist=true
   spring.datasource.username=root
   spring.datasource.password=
   server.port=8081
   ```

   > **Lưu ý**: Thay đổi `username` và `password` phù hợp với cấu hình MySQL của bạn. Database `generic_shop` sẽ tự động được tạo nếu chưa tồn tại.

---

## 🚀 Hướng Dẫn Chạy Dự Án

### 1. Chạy Backend (Spring Boot)

Mở terminal tại **thư mục gốc của dự án** (`generic_shop`):

#### Cách 1: Sử dụng Maven Wrapper (Khuyên dùng - không cần cài Maven)
- **Windows (PowerShell / Command Prompt):**
  ```powershell
  .\mvnw.cmd spring-boot:run
  ```

- **Linux / macOS:**
  ```bash
  chmod +x mvnw
  ./mvnw spring-boot:run
  ```

#### Cách 2: Sử dụng Maven đã cài trên máy
```bash
mvn spring-boot:run
```

#### Cách 3: Đóng gói và chạy file JAR độc lập
```powershell
# Build file jar (bỏ qua kiểm tra test nếu cần)
.\mvnw.cmd clean package -DskipTests

# Chạy file JAR
java -jar target/generic_shop-0.0.1-SNAPSHOT.jar
```

- **URL Backend:** [http://localhost:8081](http://localhost:8081)  
- **API Base URL:** [http://localhost:8081/api](http://localhost:8081/api)

---

### 2. Chạy Frontend (React + Vite)

Mở một cửa sổ terminal mới và di chuyển vào thư mục `frontend`:

```bash
cd frontend
```

#### Bước 1: Cài đặt thư viện dependencies (chỉ cần chạy lần đầu hoặc khi có package mới)
```bash
npm install
```

#### Bước 2: Khởi chạy môi trường phát triển (Development Mode)
```bash
npm run dev
```

- **URL Frontend:** [http://localhost:5173](http://localhost:5173)

#### Các lệnh Frontend hữu ích khác:
```bash
# Build mã nguồn cho môi trường production (tạo thư mục dist)
npm run build

# Xem thử (preview) bản build production trên local server
npm run preview

# Kiểm tra cú pháp và chất lượng mã nguồn bằng oxlint
npm run lint
```

---

## ⚡ Bảng Tra Cứu Câu Lệnh Nhanh (Cheatsheet)

| Tác vụ | Thư mục thực thi | Lệnh Windows | Lệnh Linux/Mac |
| :--- | :--- | :--- | :--- |
| **Chạy Backend (Dev)** | Thư mục gốc `.` | `.\mvnw.cmd spring-boot:run` | `./mvnw spring-boot:run` |
| **Build Backend JAR** | Thư mục gốc `.` | `.\mvnw.cmd clean package -DskipTests` | `./mvnw clean package -DskipTests` |
| **Chạy Backend JAR** | Thư mục gốc `.` | `java -jar target/generic_shop-0.0.1-SNAPSHOT.jar` | `java -jar target/generic_shop-0.0.1-SNAPSHOT.jar` |
| **Cài đặt thư viện Frontend** | Thư mục `frontend/` | `npm install` | `npm install` |
| **Chạy Frontend (Dev)** | Thư mục `frontend/` | `npm run dev` | `npm run dev` |
| **Build Frontend** | Thư mục `frontend/` | `npm run build` | `npm run build` |

---

## 🛠️ Xử Lý Lỗi Thường Gặp (Troubleshooting)

1. **Lỗi `Access denied for user 'root'@'localhost'`:**
   - Kiểm tra mật khẩu MySQL trong `src/main/resources/application.properties`. Nếu tài khoản root của bạn có mật khẩu, hãy điền vào `spring.datasource.password=<mật_khẩu_của_bạn>`.

2. **Lỗi cổng `8081` hoặc `5173` đã bị sử dụng (Port already in use):**
   - Đổi cổng backend trong `src/main/resources/application.properties` (ví dụ: `server.port=8082`).
   - Nếu đổi cổng backend, hãy cập nhật lại `baseURL` trong [frontend/src/services/api.js](file:///e:/generic_shop%20-%20api/generic_shop/frontend/src/services/api.js).

3. **Lỗi `./mvnw: Permission denied` (trên macOS/Linux):**
   - Cấp quyền thực thi cho file wrapper: `chmod +x mvnw`.