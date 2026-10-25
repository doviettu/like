# Render Z-Anatomy

Ảnh render 5 hệ cơ quan từ mô hình [Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy), góc nhìn chính diện.

- `tong-hop.png`: bảng tổng hợp có chú thích
- `skeleton.png`, `muscles.png`, `cardio.png`, `nervous.png`, `visceral.png`: từng hệ
- `render.py`: script render (Blender dạng module Python, `pip install bpy`)

```sh
unzip Z-Anatomy.zip
python3 render.py Z-Anatomy/Startup.blend "1: Skeletal system" skeleton.png
```

## Giấy phép

Các ảnh này là sản phẩm phái sinh, phát hành theo [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

- "Z-Anatomy - The libre 3D atlas of anatomy - CC-BY-SA 4.0"
- "BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan"
