# 🚀 Hướng Dẫn Tạo Release Tự Động

Tôi đã setup 3 workflows CI/CD cho project này:

## 📦 3 Workflows Đã Được Tạo

### 1. **CI - Build and Test** (`ci.yml`)
Tự động chạy mỗi khi push code hoặc tạo Pull Request:
- ✅ Kiểm tra linter
- ✅ Build project
- ✅ Verify build thành công

### 2. **Release on Tag** (`release-on-tag.yml`) - CÁCH DỄ NHẤT ⭐
Tạo release khi bạn tạo Git tag:

```bash
# Ví dụ tạo release v1.0.0
git tag v1.0.0
git push origin v1.0.0
```

Workflow sẽ tự động:
- Build project
- Tạo changelog từ commits
- Tạo GitHub Release
- Upload artifacts

### 3. **Auto Release with Release Please** (`auto-release.yml`) - CÁCH TỰ ĐỘNG HOÀN TOÀN 🤖
Tự động tạo release dựa trên commit messages:

**Cách hoạt động:**
1. Khi bạn push lên `main`, workflow sẽ tạo một Pull Request với:
   - Version mới được bump tự động
   - Changelog được generate từ commits
   
2. Khi bạn merge PR đó, release sẽ tự động được tạo!

**Quy ước commit messages:**
```bash
# Tăng patch version (1.0.0 -> 1.0.1)
git commit -m "fix: sửa lỗi đăng nhập"

# Tăng minor version (1.0.0 -> 1.1.0)
git commit -m "feat: thêm tính năng export quiz"

# Tăng major version (1.0.0 -> 2.0.0)
git commit -m "feat!: thay đổi cấu trúc database"
# hoặc
git commit -m "feat: thay đổi API

BREAKING CHANGE: API endpoint đã thay đổi"
```

## 🎯 Khuyến Nghị Sử Dụng

### **Cho người mới bắt đầu:** Dùng cách 2 (Release on Tag)
```bash
# Bước 1: Commit code như bình thường
git add .
git commit -m "Hoàn thành tính năng XYZ"
git push

# Bước 2: Khi muốn release, tạo tag
git tag v1.0.0
git push origin v1.0.0

# Xong! GitHub sẽ tự động tạo release
```

### **Cho team chuyên nghiệp:** Dùng cách 3 (Auto Release)
```bash
# Viết commit messages theo format
git commit -m "feat: thêm chức năng ABC"
git commit -m "fix: sửa bug XYZ"
git push

# Release Please sẽ tự động tạo PR
# Merge PR đó là xong!
```

## 📋 Checklist Setup

- [x] Đã tạo workflows
- [ ] Push code lên GitHub
- [ ] Kiểm tra tab "Actions" trên GitHub có workflows xuất hiện
- [ ] Thử tạo release test:
  ```bash
  git tag v0.1.0
  git push origin v0.1.0
  ```

## 🔧 Tùy Chỉnh

### Thay đổi branch chính
Nếu bạn dùng `master` thay vì `main`, sửa trong các file workflows:
```yaml
# Đổi từ
branches: [ main ]
# Thành
branches: [ master ]
```

### Thay đổi Node version
Sửa trong workflows nếu muốn dùng Node version khác:
```yaml
node-version: '20'  # Đổi thành '18' hoặc '22'
```

## ❓ Troubleshooting

**Workflow không chạy?**
- Kiểm tra tab "Actions" trên GitHub repo
- Đảm bảo workflows được enable
- Kiểm tra permissions trong Settings > Actions > General

**Release không được tạo?**
- Kiểm tra tag format phải là `v*.*.*` (ví dụ: v1.0.0, v2.1.3)
- Kiểm tra GitHub token có quyền `contents: write`

## 📚 Đọc Thêm

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Release Please](https://github.com/googleapis/release-please)
- [Conventional Commits](https://www.conventionalcommits.org/)

