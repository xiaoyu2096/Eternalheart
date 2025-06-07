  // 初始化粘贴/清空按钮状态
        const linkInput = document.getElementById('linkInput');
        const pasteClearButton = document.getElementById('pasteClearButton');
        
        // 初始设置为粘贴状态
        updatePasteClearButton();
        
        // 监听输入框变化，更新按钮状态
        linkInput.addEventListener('input', updatePasteClearButton);
        
        // 按钮点击事件
        pasteClearButton.addEventListener('click', async function() {
            if (linkInput.value.trim()) {
                // 有内容，执行清空
                linkInput.value = '';
                updatePasteClearButton();
            } else {
                // 无内容，执行粘贴
                try {
                    const text = await navigator.clipboard.readText();
                    linkInput.value = text;
                    updatePasteClearButton();
                    
                    // 粘贴后给用户反馈
                    const originalIcon = pasteClearButton.innerHTML;
                    pasteClearButton.innerHTML = '<i class="fa fa-check text-green-500"></i>';
                    setTimeout(() => {
                        pasteClearButton.innerHTML = originalIcon;
                    }, 1000);
                } catch (err) {
                    console.error('粘贴失败:', err);
                    showError('粘贴失败，请手动粘贴');
                }
            }
        });
        
        // 更新按钮状态
        function updatePasteClearButton() {
            if (linkInput.value.trim()) {
                // 有内容，显示清空图标
                pasteClearButton.innerHTML = '<i class="fa fa-times"></i>';
                pasteClearButton.title = '清空';
                pasteClearButton.classList.remove('text-gray-500');
                pasteClearButton.classList.add('text-red-500');
            } else {
                // 无内容，显示粘贴图标
                pasteClearButton.innerHTML = '<i class="fa fa-paste"></i>';
                pasteClearButton.title = '粘贴';
                pasteClearButton.classList.remove('text-red-500');
                pasteClearButton.classList.add('text-gray-500');
            }
        }

        document.getElementById('removeWatermarkButton').addEventListener('click', async () => {
            const input = document.getElementById('linkInput').value;
            
            // 恢复最初的正则表达式，确保正确提取链接
            const httpsRegex = /https?:\/\/[^\s"']+/g;
            const links = input.match(httpsRegex);
            
            if (!links || links.length === 0) {
                showError('请输入有效的https链接');
                return;
            }
            
            // 只使用第一个https链接
            const link = links[0];
            showLoading();
            
            try {
                // 打印调试信息
                console.log('提取的链接:', link);
                console.log('请求URL:', `https://api.kxzjoker.cn/api/jiexi_video?url=${encodeURIComponent(link)}`);
                
                const response = await fetch(`https://api.kxzjoker.cn/api/jiexi_video?url=${encodeURIComponent(link)}`);
                const data = await response.json();
                
                console.log('API响应:', data);
                
                if (data.success) {
                    if (data.data.video_url) {
                        showVideo(data.data.video_url);
                        setupDownload(data.data.video_url, true); // 传递true表示是视频
                    } else if (data.data.images) {
                        showImages(data.data.images);
                        setupDownload(data.data.images); // 图片仍然传递数组
                    }
                    
                    // 显示下载按钮
                    document.getElementById('downloadContainer').classList.remove('hidden');
                } else {
                    // 显示API返回的错误信息
                    showError(data.message || '处理失败，请检查链接或稍后重试');
                    console.error('API响应失败:', data);
                }
            } catch (error) {
                showError('请求出错，请检查网络或稍后重试');
                console.error('请求异常:', error);
            } finally {
                hideLoading();
            }
        });

        function showLoading() {
            document.getElementById('loading').classList.remove('hidden');
            document.getElementById('resultContainer').classList.add('hidden');
            document.getElementById('errorMessage').classList.add('hidden');
        }

        function hideLoading() {
            document.getElementById('loading').classList.add('hidden');
        }

        function showVideo(url) {
            const mediaContainer = document.getElementById('mediaContainer');
            mediaContainer.innerHTML = `<div class="flex justify-center">
                                            <video controls class="w-full max-w-xl">
                                                <source src="${url}" type="video/mp4">
                                                你的浏览器不支持视频播放。
                                            </video>
                                        </div>`;
            document.getElementById('resultContainer').classList.remove('hidden');
        }

        function showImages(images) {
            const mediaContainer = document.getElementById('mediaContainer');
            mediaContainer.innerHTML = `<div class="img-container">
                ${images.map((image, index) => `
                    <div class="processed-image">
                        <img src="${image}" alt="去水印图片 ${index + 1}" class="w-full rounded-lg">
                    </div>
                `).join('')}
            </div>`;
            document.getElementById('resultContainer').classList.remove('hidden');
        }

        function setupDownload(urls, isVideo = false) {
            const downloadButton = document.getElementById('downloadButton');
            
            // 移除之前的事件监听器
            downloadButton.removeEventListener('click', downloadButton._clickHandler || Function.prototype);
            
            if (Array.isArray(urls)) {
                // 处理多张图片的情况
                downloadButton._clickHandler = async () => {
                    try {
                        downloadButton.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i>准备下载...';
                        downloadButton.disabled = true;
                        
                        // 如果只有一张图片，直接下载
                        if (urls.length === 1) {
                            await downloadSingleFile(urls[0], false); // 明确是图片
                        } else {
                            // 多张图片需要打包下载
                            await downloadMultipleFiles(urls);
                        }
                        
                    } catch (error) {
                        console.error('下载出错:', error);
                        showError('下载失败，请稍后重试');
                    } finally {
                        downloadButton.innerHTML = '<i class="fa fa-download mr-2"></i>下载文件';
                        downloadButton.disabled = false;
                    }
                };
            } else {
                // 处理单个视频或图片的情况
                downloadButton._clickHandler = async () => {
                    try {
                        downloadButton.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i>下载中...';
                        downloadButton.disabled = true;
                        
                        // 直接传递是否为视频的标志
                        await downloadSingleFile(urls, isVideo);
                        
                    } catch (error) {
                        console.error('下载出错:', error);
                        showError('下载失败，请稍后重试');
                    } finally {
                        downloadButton.innerHTML = '<i class="fa fa-download mr-2"></i>下载文件';
                        downloadButton.disabled = false;
                    }
                };
            }
            
            downloadButton.addEventListener('click', downloadButton._clickHandler);
        }

        async function downloadSingleFile(url, isVideo) {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`下载失败: ${response.statusText}`);
            }
            
            // 生成0-10000000之间的随机数
            const randomNum = Math.floor(Math.random() * 10000001);
            const prefix = isVideo ? 'video' : 'image';
            const filename = `${prefix}${randomNum}.${isVideo ? 'mp4' : 'jpg'}`;
            
            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(downloadUrl);
            }, 100);
        }

        async function downloadMultipleFiles(urls) {
            // 多张图片需要使用JSZip库打包下载
            if (!window.JSZip) {
                // 动态加载JSZip库
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            
            // 生成0-10000000之间的随机数
            const randomNum = Math.floor(Math.random() * 10000001);
            
            const zip = new JSZip();
            
            // 逐个下载图片并添加到zip
            for (let i = 0; i < urls.length; i++) {
                const url = urls[i];
                try {
                    const response = await fetch(url);
                    if (!response.ok) {
                        console.warn(`下载图片 ${i+1} 失败: ${response.statusText}`);
                        continue;
                    }
                    
                    const blob = await response.blob();
                    zip.file(`image-${i+1}.jpg`, blob);
                    
                    // 更新按钮状态
                    downloadButton.innerHTML = `<i class="fa fa-spinner fa-spin mr-2"></i>下载中 ${i+1}/${urls.length}`;
                } catch (error) {
                    console.warn(`下载图片 ${i+1} 出错:`, error);
                }
            }
            
            // 生成并下载zip文件，使用随机数作为文件名
            zip.generateAsync({ type: 'blob' }).then(content => {
                const downloadUrl = URL.createObjectURL(content);
                
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `images${randomNum}.zip`;
                document.body.appendChild(a);
                a.click();
                
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(downloadUrl);
                }, 100);
            });
        }

        function showError(message) {
            const errorText = document.getElementById('errorText');
            errorText.textContent = message;
            document.getElementById('errorMessage').classList.remove('hidden');
        }
