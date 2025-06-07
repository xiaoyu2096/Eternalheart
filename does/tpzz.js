 // DOM元素引用
    const imageInput = document.getElementById('imageInput');
    const processButton = document.getElementById('processButton');
    const shapeSizeInput = document.getElementById('shapeSize');
    const shapesPerStepInput = document.getElementById('shapesPerStep');
    const totalStepsInput = document.getElementById('totalSteps');
    const canvasSection = document.getElementById('canvasSection');
    const downloadButton = document.getElementById('downloadButton');
    const invertColorsCheckbox = document.getElementById('invertColors');
    const selectedImagePreview = document.getElementById('selectedImagePreview');
    const previewImage = document.getElementById('previewImage');
    const previewFileName = document.getElementById('previewFileName');
    const previewFileSize = document.getElementById('previewFileSize');
    const compressedFileSize = document.getElementById('compressedFileSize');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const resultsSection = document.getElementById('resultsSection');
    const useBlackBackgroundCheckbox = document.getElementById('useBlackBackground');
    const compressionQualityInput = document.getElementById('compressionQuality');
    const compressionValue = document.getElementById('compressionValue');

    // 全局变量
    let sourceImage = null;
    let compressedImage = null;
    let generatedCanvases = [];
    let isImageCompressed = false;

    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
        // 事件监听
        imageInput.addEventListener('change', handleImageSelection);
        processButton.addEventListener('click', processImage);
        downloadButton.addEventListener('click', downloadResults);
        
        // 拖拽上传支持
        document.addEventListener('dragover', handleDragOver);
        document.addEventListener('drop', handleDrop);
        
        // 输入验证
        shapeSizeInput.addEventListener('input', validateInputs);
        shapesPerStepInput.addEventListener('input', validateInputs);
        totalStepsInput.addEventListener('input', validateInputs);
        useBlackBackgroundCheckbox.addEventListener('change', validateInputs);
        compressionQualityInput.addEventListener('input', updateCompressionValue);
        
        // 初始化压缩质量显示
        updateCompressionValue();
    });

    // 更新压缩质量显示
    function updateCompressionValue() {
        compressionValue.textContent = compressionQualityInput.value;
    }

    // 处理图片选择
    function handleImageSelection(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            showError('请选择有效的图片文件');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            sourceImage = new Image();
            sourceImage.src = event.target.result;
            sourceImage.onload = () => {
                showImagePreview(file);
                validateInputs();
                compressImage(sourceImage, parseFloat(compressionQualityInput.value));
            };
            sourceImage.onerror = () => {
                showError('图片加载失败');
            };
        };
        reader.readAsDataURL(file);
    }

    // 压缩图片
    function compressImage(image, quality) {
        showLoading("正在压缩图片...");
        
        // 创建临时画布
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置画布尺寸，保持原始宽高比，但最大尺寸不超过1000px
        const maxDimension = 1000;
        let width = image.width;
        let height = image.height;
        
        if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 绘制图片到画布
        ctx.drawImage(image, 0, 0, width, height);
        
        // 将画布内容转换为Blob对象（使用指定的质量参数）
        canvas.toBlob((blob) => {
            if (!blob) {
                hideLoading();
                showError('图片压缩失败');
                return;
            }
            
            // 创建压缩后的图片对象
            compressedImage = new Image();
            compressedImage.src = URL.createObjectURL(blob);
            compressedImage.onload = () => {
                isImageCompressed = true;
                hideLoading();
                
                // 显示压缩后的文件大小
                compressedFileSize.textContent = `压缩后大小: ${formatFileSize(blob.size)} (节省 ${Math.round((1 - blob.size / (image.width * image.height * 4)) * 100)}%)`;
                compressedFileSize.classList.remove('hidden');
                
                validateInputs();
            };
            compressedImage.onerror = () => {
                hideLoading();
                showError('压缩图片加载失败');
            };
        }, image.src.includes('png') ? 'image/png' : 'image/jpeg', quality);
    }

    // 显示图片预览
    function showImagePreview(file) {
        previewImage.src = URL.createObjectURL(file);
        previewFileName.textContent = file.name;
        previewFileSize.textContent = `原始大小: ${formatFileSize(file.size)}`;
        selectedImagePreview.classList.remove('hidden');
        
        // 隐藏压缩后文件大小显示
        compressedFileSize.classList.add('hidden');
        
        // 自动释放URL对象
        setTimeout(() => {
            URL.revokeObjectURL(previewImage.src);
        }, 30000);
    }

    // 格式化文件大小
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    }

    // 处理拖放事件
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('image/')) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                imageInput.files = dataTransfer.files;
                const event = new Event('change');
                imageInput.dispatchEvent(event);
            } else {
                showError('请拖放有效的图片文件');
            }
        }
    }

    // 验证输入
    function validateInputs() {
        const shapeSize = parseInt(shapeSizeInput.value);
        const shapesPerStep = parseInt(shapesPerStepInput.value);
        const totalSteps = parseInt(totalStepsInput.value);
        
        const isValid = !isNaN(shapeSize) && shapeSize > 0 && 
                      !isNaN(shapesPerStep) && shapesPerStep > 0 && 
                      !isNaN(totalSteps) && totalSteps > 0 && 
                      (isImageCompressed ? compressedImage : sourceImage);
        
        processButton.disabled = !isValid;
    }

    // 获取背景颜色值
    function getBackgroundColor() {
        return useBlackBackgroundCheckbox.checked ? 0 : 255;
    }

    // 显示加载提示
    function showLoading(message) {
        loadingIndicator.querySelector('h3').textContent = message;
        loadingIndicator.classList.remove('hidden');
    }

    // 隐藏加载提示
    function hideLoading() {
        loadingIndicator.classList.add('hidden');
    }

    // 处理图片
    async function processImage() {
        // 重置状态
        hideError();
        canvasSection.innerHTML = '';
        generatedCanvases = [];
        downloadButton.disabled = true;
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // 显示加载状态
        showLoading("正在处理图片");
        progressBar.style.width = '0%';
        progressText.textContent = '0% 完成';
        
        try {
            const shapeSize = parseInt(shapeSizeInput.value);
            const shapesPerStep = parseInt(shapesPerStepInput.value);
            const totalSteps = parseInt(totalStepsInput.value);
            const shouldInvertColors = invertColorsCheckbox.checked;
            const backgroundColor = getBackgroundColor(); // 获取背景颜色值
            
            // 使用压缩后的图片（如果有）
            const imageToProcess = compressedImage || sourceImage;

            // 创建基础画布
            const baseCanvas = document.createElement('canvas');
            const baseCtx = baseCanvas.getContext('2d');
            baseCanvas.width = imageToProcess.width;
            baseCanvas.height = imageToProcess.height;

            // 绘制原始图像
            baseCtx.drawImage(imageToProcess, 0, 0);
            
            // 获取图像数据
            const imageData = baseCtx.getImageData(0, 0, baseCanvas.width, baseCanvas.height);
            const data = imageData.data;
            
            // 根据选择的背景颜色处理像素
            for (let i = 0; i < data.length; i += 4) {
                // 如果是透明像素，则根据背景色设置RGB值
                if (data[i + 3] === 0) {
                    data[i] = backgroundColor;
                    data[i + 1] = backgroundColor;
                    data[i + 2] = backgroundColor;
                    data[i + 3] = 255; // 设置为不透明
                }
            }
            
            // 应用修改后的图像数据
            baseCtx.putImageData(imageData, 0, 0);

            // 应用反色效果
            if (shouldInvertColors) {
                invertColors(baseCanvas);
            }
            
            // 初始化已使用像素数组
            const usedPixels = new Array(baseCanvas.width * baseCanvas.height).fill(false);
            
            // 分步骤处理图片（前totalSteps-1步生成碎片）
            for (let step = 0; step < totalSteps - 1; step++) {
                // 更新进度
                const progress = Math.round(((step + 1) / totalSteps) * 100);
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${progress}% 完成`;
                
                // 生成随机圆形
                const currentCircles = generateCircles(baseCanvas, shapeSize, shapesPerStep);
                
                // 提取当前步骤的碎片
                const cutoutCanvas = cutoutImage(baseCanvas, currentCircles, usedPixels);
                
                // 添加尺寸控制样式
                cutoutCanvas.style.width = '100%';
                cutoutCanvas.style.height = 'auto';
                cutoutCanvas.style.maxWidth = '800px';
                cutoutCanvas.style.margin = '0 auto';

                // 将生成的画布添加到结果区域和数组
                const canvasWrapper = document.createElement('div');
                canvasWrapper.className = 'canvas-container';
                canvasWrapper.appendChild(cutoutCanvas);
                canvasSection.appendChild(canvasWrapper);
                
                generatedCanvases.push(cutoutCanvas);
            }

            // 第totalSteps步生成剩余区域
            const remainingCanvas = extractRemainingArea(baseCanvas, usedPixels);
            remainingCanvas.style.width = '100%';
            remainingCanvas.style.height = 'auto';
            remainingCanvas.style.maxWidth = '800px';
            remainingCanvas.style.margin = '0 auto';

            const remainingWrapper = document.createElement('div');
            remainingWrapper.className = 'canvas-container';
            remainingWrapper.appendChild(remainingCanvas);
            canvasSection.appendChild(remainingWrapper);
            generatedCanvases.push(remainingCanvas);

            // 最终进度更新
            progressBar.style.width = '100%';
            progressText.textContent = '100% 完成';
            downloadButton.disabled = false; // 确保处理完成后启用下载按钮
            showSuccess('处理完成！可以下载结果了');
        } catch (error) {
            console.error('Error processing image:', error);
            showError('处理图片时出错: ' + error.message);
        } finally {
            // 无论成功或失败都隐藏加载提示
            hideLoading();
        }
    }

    // 生成随机圆形
    function generateCircles(canvas, shapeSize, count) {
        const circles = [];
        const radius = shapeSize / 2;
        
        for (let i = 0; i < count; i++) {
            // 确保圆形不会超出画布边界
            const x = radius + Math.random() * (canvas.width - 2 * radius);
            const y = radius + Math.random() * (canvas.height - 2 * radius);
            
            circles.push({ x, y, radius });
        }
        
        return circles;
    }

    // 从图片中抠出圆形区域
    function cutoutImage(baseCanvas, circles, usedPixels) {
        const cutoutCanvas = document.createElement('canvas');
        const cutoutCtx = cutoutCanvas.getContext('2d');
        cutoutCanvas.width = baseCanvas.width;
        cutoutCanvas.height = baseCanvas.height;
        
        // 复制原始图像
        cutoutCtx.drawImage(baseCanvas, 0, 0);
        
        // 获取图像数据
        const imageData = cutoutCtx.getImageData(0, 0, cutoutCanvas.width, cutoutCanvas.height);
        const data = imageData.data;
        
        // 获取背景颜色值
        const backgroundColor = getBackgroundColor();
        
        // 遍历每个像素，检查是否在任何圆形内
        for (let j = 0; j < data.length; j += 4) {
            const px = (j / 4) % cutoutCanvas.width;
            const py = Math.floor((j / 4) / cutoutCanvas.height);
            let isInsideAnyCircle = false;
            
            // 检查当前像素是否在任何圆形内
            for (const circle of circles) {
                const distanceSquared = (px - circle.x) * (px - circle.x) + (py - circle.y) * (py - circle.y);
                if (distanceSquared <= circle.radius * circle.radius) {
                    isInsideAnyCircle = true;
                    usedPixels[px + py * cutoutCanvas.width] = true;
                    break;
                }
            }
            
            // 如果不在任何圆形内，则根据背景色设置颜色
            if (!isInsideAnyCircle) {
                data[j] = backgroundColor;
                data[j + 1] = backgroundColor;
                data[j + 2] = backgroundColor;
            }
        }
        
        // 应用修改后的图像数据
        cutoutCtx.putImageData(imageData, 0, 0);
        
        return cutoutCanvas;
    }

    // 反色处理
    function invertColors(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    // 提取剩余未处理区域
    function extractRemainingArea(baseCanvas, usedPixels) {
        const remainingCanvas = document.createElement('canvas');
        const remainingCtx = remainingCanvas.getContext('2d');
        remainingCanvas.width = baseCanvas.width;
        remainingCanvas.height = baseCanvas.height;
        remainingCtx.drawImage(baseCanvas, 0, 0);

        const imageData = remainingCtx.getImageData(0, 0, remainingCanvas.width, remainingCanvas.height);
        const data = imageData.data;
        
        // 获取背景颜色值
        const backgroundColor = getBackgroundColor();
        
        for (let j = 0; j < data.length; j += 4) {
            const px = (j / 4) % remainingCanvas.width;
            const py = Math.floor((j / 4) / remainingCanvas.height);
            if (usedPixels[px + py * remainingCanvas.width]) {
                // 根据选择设置已使用像素的颜色
                data[j] = backgroundColor;    
                data[j + 1] = backgroundColor;
                data[j + 2] = backgroundColor;
            }
        }
        remainingCtx.putImageData(imageData, 0, 0);
        return remainingCanvas;
    }

    // 下载结果
    function downloadResults() {
        if (generatedCanvases.length === 0) {
            showError('没有可下载的图片');
            return;
        }

        const zip = new JSZip();
        const folder = zip.folder(`拼好图结果`+Math.floor(Math.random() * 100000000).toString());

        const blobPromises = [];

        // 收集所有画布的blob生成Promise
        generatedCanvases.forEach((canvas, index) => {
            blobPromises.push(new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    folder.file(`拼好图_步骤${index + 1}.png`, blob);
                    resolve();
                }, 'image/png');
            }));
        });

        // 等待所有blob生成后再下载
        Promise.all(blobPromises).then(() => {
            zip.generateAsync({ type: "blob" }).then((content) => {
                saveAs(content, "拼好图结果"+Math.floor(Math.random() * 100000000).toString()+".zip");
            });
        });
    }

    // 显示错误信息
    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('hidden');
        errorMessage.scrollIntoView({ behavior: 'smooth' });
        
        // 自动隐藏错误提示
        setTimeout(() => {
            hideError();
        }, 8000);
    }

    // 隐藏错误信息
    function hideError() {
        errorMessage.classList.add('hidden');
    }

    // 显示成功信息
    function showSuccess(message) {
        // 可以添加成功提示UI
        console.log(message);
    }

    // 估算Canvas大小
    function estimateCanvasSize(canvas) {
        // 这只是一个估算，实际文件大小可能因压缩等因素而不同
        const width = canvas.width;
        const height = canvas.height;
        const pixelCount = width * height;
        // 每个像素4字节(RGBA)，再加上一些元数据
        return pixelCount * 4 + 1024;
    }