function gilbert2d(width, height) {
    const coordinates = [];

    if (width >= height) {
        generate2d(0, 0, width, 0, 0, height, coordinates);
    } else {
        generate2d(0, 0, 0, height, width, 0, coordinates);
    }

    return coordinates;
}

function generate2d(x, y, ax, ay, bx, by, coordinates) {
    const w = Math.abs(ax + ay);
    const h = Math.abs(bx + by);

    const dax = Math.sign(ax), day = Math.sign(ay);
    const dbx = Math.sign(bx), dby = Math.sign(by);

    if (h === 1) {
        for (let i = 0; i < w; i++) {
            coordinates.push([x, y]);
            x += dax;
            y += day;
        }
        return;
    }

    if (w === 1) {
        for (let i = 0; i < h; i++) {
            coordinates.push([x, y]);
            x += dbx;
            y += dby;
        }
        return;
    }

    let ax2 = Math.floor(ax / 2), ay2 = Math.floor(ay / 2);
    let bx2 = Math.floor(bx / 2), by2 = Math.floor(by / 2);

    const w2 = Math.abs(ax2 + ay2);
    const h2 = Math.abs(bx2 + by2);

    if (2 * w > 3 * h) {
        if ((w2 % 2) && (w > 2)) {
            ax2 += dax;
            ay2 += day;
        }

        generate2d(x, y, ax2, ay2, bx, by, coordinates);
        generate2d(x + ax2, y + ay2, ax - ax2, ay - ay2, bx, by, coordinates);

    } else {
        if ((h2 % 2) && (h > 2)) {
            bx2 += dbx;
            by2 += dby;
        }

        generate2d(x, y, bx2, by2, ax2, ay2, coordinates);
        generate2d(x + bx2, y + by2, ax, ay, bx - bx2, by - by2, coordinates);
        generate2d(x + (ax - dax) + (bx2 - dbx), y + (ay - day) + (by2 - dby),
            -bx2, -by2, -(ax - ax2), -(ay - ay2), coordinates);
    }
}

const imageResults = document.getElementById("imageResults");
let processedBlobs = [];

function setsrc(src, blob) {
    const img = document.createElement("img");
    img.src = src;
    img.style.maxWidth = "100%";
    img.style.display = "inline-block";
    imageResults.appendChild(img);
    document.getElementById("emptyState").style.display = "none";
    document.getElementById("download").disabled = false;
    processedBlobs.push(blob);
}

// 新增：基于密钥的哈希函数
function hashKey(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        const char = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// 修改：加密函数使用密钥
function encrypt(img) {
    const secretKey = document.getElementById("secretKey").value.trim();
    const cvs = document.createElement("canvas");
    const width = cvs.width = img.width;
    const height = cvs.height = img.height;
    const ctx = cvs.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const imgdata = ctx.getImageData(0, 0, width, height);
    const imgdata2 = new ImageData(width, height);
    const curve = gilbert2d(width, height);

    // 使用密钥生成偏移量，若无密钥则使用固定值
    const offset = secretKey
        ? hashKey(secretKey) % (width * height)
        : Math.floor((Math.sqrt(5) - 1) / 2 * width * height);

    for (let i = 0; i < width * height; i++) {
        const old_pos = curve[i];
        const new_pos = curve[(i + offset) % (width * height)];
        const old_p = 4 * (old_pos[0] + old_pos[1] * width);
        const new_p = 4 * (new_pos[0] + new_pos[1] * width);
        imgdata2.data.set(imgdata.data.slice(old_p, old_p + 4), new_p);
    }

    ctx.putImageData(imgdata2, 0, 0);
    cvs.toBlob(b => {
        const src = URL.createObjectURL(b);
        setsrc(src, b);
    }, "image/jpeg", 0.95);
}

// 修改：解密函数使用密钥
function decrypt(img) {
    const secretKey = document.getElementById("secretKey").value.trim();
    const cvs = document.createElement("canvas");
    const width = cvs.width = img.width;
    const height = cvs.height = img.height;
    const ctx = cvs.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const imgdata = ctx.getImageData(0, 0, width, height);
    const imgdata2 = new ImageData(width, height);
    const curve = gilbert2d(width, height);

    // 使用相同的密钥生成相同的偏移量，若无密钥则使用固定值
    const offset = secretKey
        ? hashKey(secretKey) % (width * height)
        : Math.floor((Math.sqrt(5) - 1) / 2 * width * height);

    for (let i = 0; i < width * height; i++) {
        const old_pos = curve[i];
        const new_pos = curve[(i + offset) % (width * height)];
        const old_p = 4 * (old_pos[0] + old_pos[1] * width);
        const new_p = 4 * (new_pos[0] + new_pos[1] * width);
        imgdata2.data.set(imgdata.data.slice(new_p, new_p + 4), old_p);
    }

    ctx.putImageData(imgdata2, 0, 0);
    cvs.toBlob(b => {
        const src = URL.createObjectURL(b);
        setsrc(src, b);
    }, "image/jpeg", 0.95);
}

const ipt = document.getElementById("imageInput");
ipt.onchange = () => {
    if (ipt.files.length > 0) {
        // 清空现有图片并重置状态
        imageResults.innerHTML = "";
        processedBlobs = [];
        document.getElementById("download").disabled = true;
        document.getElementById("emptyState").style.display = "block";

        const files = ipt.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                // 修复：在图片加载完成后再添加到结果区域
                img.onload = () => {
                    setsrc(img.src, file);
                };
            };
            reader.readAsDataURL(file);
        }
    }
}

const btn_enc = document.getElementById("enc");
btn_enc.onclick = () => {
    if (imageResults.children.length > 0) {
        // 修复：先获取当前图片列表，再清空容器
        const images = Array.from(imageResults.children);
        imageResults.innerHTML = "";
        processedBlobs = [];
        document.getElementById("loadingState").style.display = "block";
        
        // 修复：处理获取到的图片列表
        images.forEach(img => {
            encrypt(img);
        });
        
        document.getElementById("loadingState").style.display = "none";
    }
}

const btn_dec = document.getElementById("dec");
btn_dec.onclick = () => {
    if (imageResults.children.length > 0) {
        // 修复：先获取当前图片列表，再清空容器
        const images = Array.from(imageResults.children);
        imageResults.innerHTML = "";
        processedBlobs = [];
        document.getElementById("loadingState").style.display = "block";
        
        // 修复：处理获取到的图片列表
        images.forEach(img => {
            decrypt(img);
        });
        
        document.getElementById("loadingState").style.display = "none";
    }
}

const btn_download = document.getElementById("download");
btn_download.onclick = () => {
    if (processedBlobs.length > 0) {
        processedBlobs.forEach((blob, index) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `processed_image_${index + 1}_${new Date().getTime()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
}