        // DOM元素引用
		        const imageInput = document.getElementById('imageInput');
		        const mergeButton = document.getElementById('mergeButton');
		        const loading = document.getElementById('loading');
		        const mergedImageContainer = document.getElementById('mergedImageContainer');
		        const mergedImage = document.getElementById('mergedImage');
		        const selectedImagesContainer = document.getElementById('selectedImages');
		        const errorMessage = document.getElementById('errorMessage');
		        const errorText = document.getElementById('errorText');
		        const screenModeCheckbox = document.getElementById('screenMode'); // 滤色/暗色开关
		        const invertColorsCheckbox = document.getElementById('invertColors'); // 反色开关
		        const downloadButton = document.getElementById('downloadButton'); // 新增：下载按钮
		
		        // 已选择的图片列表
		        let selectedImages = [];
		        // 新增：保存合成图片的URL
		        let mergedImageUrl = '';
		
		        // 初始化事件监听
		        initEventListeners();
		
		        function initEventListeners() {
		            // 图片选择
		            imageInput.addEventListener('change', handleImageSelection);
		
		            // 合成按钮点击
		            mergeButton.addEventListener('click', mergeImages);
		
		            // 下载按钮点击
		            downloadButton.addEventListener('click', downloadMergedImage);
		
		            // 拖拽上传支持
		            document.addEventListener('dragover', handleDragOver);
		            document.addEventListener('drop', handleDrop);
		            
		            // 修复：为滑动开关添加事件监听，确保可点击
		            screenModeCheckbox.addEventListener('change', function() {
		                this.blur(); // 移除焦点，避免视觉上的焦点环
		            });
		            
		            invertColorsCheckbox.addEventListener('change', function() {
		                this.blur(); // 移除焦点，避免视觉上的焦点环
		            });
		        }
		
		        // 处理图片选择
		        function handleImageSelection(e) {
		            const files = Array.from(e.target.files);
		            if (files.length === 0) return;
		
		            // 重置已选图片区域
		            selectedImages = [];
		            selectedImagesContainer.innerHTML = '';
		            selectedImagesContainer.classList.remove('hidden');
		
		            // 加载并预览每张图片
		            files.forEach(file => {
		                // 优化文件类型检查
		                const isImage = file.type.startsWith('image/') || 
		                               file.name.toLowerCase().match(/\.(png|jpe?g|gif|bmp|webp)$/);
		                if (!isImage) {
		                    showError('请只选择图片文件');
		                    return;
		                }
		
		                selectedImages.push(file);
		
		                const reader = new FileReader();
		                reader.onload = function(event) {
		                    const imgContainer = document.createElement('div');
		                    imgContainer.className = 'relative group';
		
		                    const img = document.createElement('img');
		                    img.src = event.target.result;
		                    img.className = 'w-full h-24 object-cover rounded-lg border-2 border-transparent group-hover:border-primary transition-all duration-300';
		                    img.alt = '预览图';
		
		                    imgContainer.appendChild(img);
		                    selectedImagesContainer.appendChild(imgContainer);
		                };
		                reader.readAsDataURL(file);
		            });
		
		            // 启用合成按钮
		            mergeButton.disabled = selectedImages.length < 2;
		        }
		
		        // 处理拖拽
		        function handleDragOver(e) {
		            e.preventDefault();
		            e.stopPropagation();
		        }
		
		        function handleDrop(e) {
		            e.preventDefault();
		            e.stopPropagation();
		
		            if (e.dataTransfer.files.length > 0) {
		                const dataTransfer = new DataTransfer();
		                Array.from(e.dataTransfer.files).forEach(file => {
		                    if (file.type.startsWith('image/')) {
		                        dataTransfer.items.add(file);
		                    }
		                });
		
		                if (dataTransfer.files.length > 0) {
		                    imageInput.files = dataTransfer.files;
		                    const event = new Event('change');
		                    imageInput.dispatchEvent(event);
		                } else {
		                    showError('请只拖拽图片文件');
		                }
		            }
		        }
		
		        // 合并图片
		        async function mergeImages() {
		            if (selectedImages.length < 2) {
		                showError('请至少选择两张图片进行合成');
		                return;
		            }
		
		            // 重置状态
		            hideError();
		            loading.classList.remove('hidden');
		            mergedImageContainer.classList.add('hidden');
		
		            try {
		                // 加载第一张图片作为基准
		                const firstImage = await loadImage(selectedImages[0]);
		
		                // 创建画布
		                const canvas = document.createElement('canvas');
		                canvas.width = firstImage.width;
		                canvas.height = firstImage.height;
		                const ctx = canvas.getContext('2d');
		
		                // 绘制第一张图片
		                ctx.drawImage(firstImage, 0, 0);
		
		                // 根据复选框状态设置混合模式
		                const isScreenMode = screenModeCheckbox.checked;
		                ctx.globalCompositeOperation = isScreenMode ? 'screen' : 'darken';
		
		                // 依次绘制后续图片
		                for (let i = 1; i < selectedImages.length; i++) {
		                    const image = await loadImage(selectedImages[i]);
		
		                    // 确保所有图片尺寸一致
		                    if (image.width !== canvas.width || image.height !== canvas.height) {
		                        const tempCanvas = document.createElement('canvas');
		                        tempCanvas.width = canvas.width;
		                        tempCanvas.height = canvas.height;
		                        const tempCtx = tempCanvas.getContext('2d');
		                        tempCtx.drawImage(image, 0, 0, canvas.width, canvas.height);
		                        ctx.drawImage(tempCanvas, 0, 0);
		                    } else {
		                        ctx.drawImage(image, 0, 0);
		                    }
		                }
		
		                // 颜色反转处理
		                if (invertColorsCheckbox.checked) {
		                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		                    const data = imageData.data;
		                    
		                    for (let i = 0; i < data.length; i += 4) {
		                        data[i] = 255 - data[i];     // 红
		                        data[i + 1] = 255 - data[i + 1]; // 绿
		                        data[i + 2] = 255 - data[i + 2]; // 蓝
		                        // 保留透明度（i+3）
		                    }
		                    
		                    ctx.putImageData(imageData, 0, 0);
		                }
		
		                // 保存合成图片的URL
		                mergedImageUrl = canvas.toDataURL('image/png');
		                
		                // 显示合成结果
		                mergedImage.src = mergedImageUrl;
		                mergedImageContainer.classList.remove('hidden');
		
		                // 添加淡入动画
		                setTimeout(() => {
		                    mergedImage.style.opacity = '1';
		                }, 100);
		
		            } catch (error) {
		                showError(`合成图片时出错: ${error.message}`);
		                console.error("合成过程中出现错误:", error);
		            } finally {
		                loading.classList.add('hidden');
		                // 修复：不再禁用按钮，允许用户多次合成
		                mergeButton.disabled = false;
		            }
		        }
		
		        // 下载合成的图片
		        function downloadMergedImage() {
		            if (!mergedImageUrl) {
		                showError('没有可下载的图片');
		                return;
		            }
		            
		            // 创建一个临时的<a>元素
		            const link = document.createElement('a');
		            link.href = mergedImageUrl;
		            
		            // 设置下载文件名
		            const now = new Date();
		            const filename = `image_merge_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}.png`;
		            link.download = filename;
		            
		            // 模拟点击下载
		            document.body.appendChild(link);
		            link.click();
		            
		            // 清理
		            document.body.removeChild(link);
		            
		            // 添加下载反馈动画
		            const originalText = downloadButton.innerHTML;
		            downloadButton.innerHTML = '<i class="fa fa-check mr-2"></i>下载成功';
		            downloadButton.classList.remove('bg-green-600', 'hover:bg-green-700');
		            downloadButton.classList.add('bg-green-500');
		            
		            setTimeout(() => {
		                downloadButton.innerHTML = originalText;
		                downloadButton.classList.remove('bg-green-500');
		                downloadButton.classList.add('bg-green-600', 'hover:bg-green-700');
		            }, 2000);
		        }
		
		        // 加载图片
		        function loadImage(file) {
		            return new Promise((resolve, reject) => {
		                const img = new Image();
		                img.src = URL.createObjectURL(file);
		
		                img.onload = () => {
		                    URL.revokeObjectURL(img.src);
		                    resolve(img);
		                };
		
		                img.onerror = () => {
		                    URL.revokeObjectURL(img.src);
		                    reject(new Error('图片加载失败'));
		                };
		            });
		        }
		
		        // 显示错误信息
		        function showError(message) {
		            errorText.textContent = message;
		            errorMessage.classList.remove('hidden');
		
		            // 自动隐藏错误提示
		            setTimeout(() => {
		                hideError();
		            }, 5000);
		        }
		
		        // 隐藏错误信息
		        function hideError() {
		            errorMessage.classList.add('hidden');
		        }
		
		        // 添加键盘快捷键支持
		        document.addEventListener('keydown', (e) => {
		            // Ctrl/Cmd + Enter 触发合成
		            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
		                if (!mergeButton.disabled) {
		                    mergeButton.click();
		                }
		            }
		            
		            // Ctrl/Cmd + D 触发下载
		            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
		                if (mergedImageUrl) {
		                    downloadMergedImage();
		                }
		            }
		        });