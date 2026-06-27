/**
 * ============================================================
 * 吴虹霖个人作品集 · 主交互脚本
 * 功能：视频弹窗 / 板块标签切换 / 子分类切换 /
 *       画廊展开收起 / 浮动导航 / ed.txt内容加载 /
 *       文件夹素材自动渲染 / 视频内联播放
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ============================================================
       1. 视频弹窗 (Video Modal)
       点击视频舞台 → 弹出全屏播放器
       ============================================================ */
    const modal = document.getElementById('video-modal');
    const modalPlayer = document.getElementById('modal-player');
    const modalClose = document.querySelector('.video-modal__close');
    const modalBackdrop = document.querySelector('.video-modal__backdrop');

    /** 打开弹窗，加载视频源 */
    function openModal(videoSrc) {
        if (!modal || !modalPlayer) return;
        modalPlayer.src = videoSrc;
        modalPlayer.load();
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // 禁止背景滚动
        modalPlayer.play().catch(() => {});
    }

    /** 关闭弹窗，停止播放 */
    function closeModal() {
        if (!modal || !modalPlayer) return;
        modalPlayer.pause();
        modalPlayer.src = '';
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // 绑定关闭事件
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    // ESC 关闭弹窗
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.hidden) {
            closeModal();
        }
    });

    // 为所有视频舞台绑定点击 → 打开弹窗
    document.querySelectorAll('.video-work__stage').forEach(stage => {
        const videoSrc = stage.dataset.videoSrc;
        if (!videoSrc) return;

        stage.addEventListener('click', (e) => {
            // 如果点击的是播放按钮，不弹出（按钮有自己的逻辑）
            if (e.target.closest('.video-work__play')) return;
            openModal(videoSrc);
        });

        // 键盘可访问
        stage.setAttribute('tabindex', '0');
        stage.setAttribute('role', 'button');
        stage.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal(videoSrc);
            }
        });
    });

    /* ============================================================
       2. 大板块切换 (Slide Tabs)
       点击"光影流动/全域运营/笔墨叙事" → 滚动到对应板块
       ============================================================ */
    const viewport = document.querySelector('.board-viewport');
    const slideTabs = Array.from(document.querySelectorAll('.slide-tab'));
    const boardSlides = Array.from(document.querySelectorAll('.board-slide'));

    /** 设置大板块标签的激活状态 */
    function setBoardActive(boardId) {
        slideTabs.forEach(tab => {
            const isActive = tab.dataset.target === boardId;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        boardSlides.forEach(slide => {
            slide.classList.toggle('is-active', slide.id === boardId);
        });
    }

    if (viewport && slideTabs.length && boardSlides.length) {
        // 初始化标签属性
        slideTabs.forEach(tab => {
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-selected', tab.classList.contains('is-active') ? 'true' : 'false');
            tab.addEventListener('click', () => {
                const targetSlide = document.getElementById(tab.dataset.target);
                if (!targetSlide) return;
                // 滚动视口到对应板块
                targetSlide.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
                setBoardActive(targetSlide.id);
            });
        });

        // IntersectionObserver：滚动时自动同步激活标签
        const boardObserver = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter(entry => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
                if (visible) {
                    setBoardActive(visible.target.id);
                }
            },
            { root: viewport, threshold: [0.45, 0.6, 0.75] }
        );

        boardSlides.forEach(slide => boardObserver.observe(slide));
        setBoardActive(boardSlides[0].id);
    }

    /* ============================================================
       3. 子分类标签切换 (Inline Tabs)
       每个大板块内部的子分类（微电影/纪录片... 等）
       通用函数：查找同级 .inline-tab 和 .inline-cat
       ============================================================ */

    /**
     * 播放容器内所有在视口中的视频
     * 对未加载的视频先调用 load() 强制加载，再等待可播放后播放
     * @param {HTMLElement} container - 父容器
     */
    function playVisibleVideos(container) {
        if (!container) return;
        container.querySelectorAll('.video-work__player').forEach(video => {
            const rect = video.getBoundingClientRect();
            if (rect.top >= window.innerHeight - 100 || rect.bottom <= 100) return;

            // 如果视频尚未加载数据，先强制加载
            if (video.readyState < 2) {
                video.load();
                video.addEventListener('canplay', function handler() {
                    video.removeEventListener('canplay', handler);
                    video.play().catch(() => {});
                }, { once: true });
            } else {
                video.play().catch(() => {});
            }
        });
    }

    /**
     * 初始化一组子分类标签
     * 切换时同时触发可见视频的播放（解决 display:none 切换后 IntersectionObserver 不重新检测的问题）
     * @param {string} tabsSelector - 标签按钮的选择器
     * @param {string} catsSelector - 内容区的选择器
     */
    function initInlineTabs(tabsSelector, catsSelector) {
        const tabs = Array.from(document.querySelectorAll(tabsSelector));
        const cats = Array.from(document.querySelectorAll(catsSelector));

        if (!tabs.length || !cats.length) return;

        function activateCat(catId) {
            tabs.forEach(t => t.classList.toggle('is-active', t.dataset.target === catId));
            cats.forEach(c => c.classList.toggle('is-active', c.id === catId));

            // 延迟播放：等浏览器完成 display:none → display:block 的布局后再触发
            const activeCat = cats.find(c => c.id === catId);
            if (activeCat) {
                setTimeout(() => playVisibleVideos(activeCat), 150);
            }
        }

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                activateCat(tab.dataset.target);
            });
        });

        // 初始化时播放默认激活分类中的可见视频
        const initCat = cats.find(c => c.classList.contains('is-active'));
        if (initCat) {
            setTimeout(() => playVisibleVideos(initCat), 300);
        }
    }

    // 初始化各板块的子分类
    initInlineTabs('#board-motion .inline-tab', '#board-motion .inline-cat');
    initInlineTabs('#board-operation .inline-tab', '#board-operation .inline-cat');
    initInlineTabs('#board-writing .inline-tab', '#board-writing .inline-cat');

    /* ============================================================
       4. 运营截图画廊展开/收起
       ============================================================ */
    document.querySelectorAll('.gallery-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const strip = btn.nextElementSibling;
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', !expanded);
            strip.hidden = expanded;
        });
    });

    /* ============================================================
       5. 视频内联播放控制
       舞台内的预览视频：进入视口自动播放，离开暂停
       播放按钮切换播放/暂停
       ============================================================ */

    // 统一设置 preload，确保浏览器提前加载视频首帧
    document.querySelectorAll('.video-work__player').forEach(v => {
        v.setAttribute('preload', 'metadata');
    });

    document.querySelectorAll('.video-work__stage').forEach(stage => {
        const video = stage.querySelector('.video-work__player');
        const playBtn = stage.querySelector('.video-work__play');
        if (!video || !playBtn) return;

        // 播放/暂停切换
        const togglePlay = () => {
            if (video.paused) {
                // 如果视频未加载数据，先强制加载再播放
                if (video.readyState < 2) {
                    playBtn.textContent = '⏳';
                    video.load();
                    video.addEventListener('canplay', function handler() {
                        video.removeEventListener('canplay', handler);
                        video.play().catch(() => {});
                        playBtn.textContent = '⏸';
                        playBtn.classList.add('is-playing');
                    }, { once: true });
                } else {
                    video.play().catch(() => {});
                    playBtn.textContent = '⏸';
                    playBtn.classList.add('is-playing');
                }
            } else {
                video.pause();
                playBtn.textContent = '▶';
                playBtn.classList.remove('is-playing');
            }
        };

        playBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止冒泡到舞台（舞台点击会打开弹窗）
            togglePlay();
        });

        video.addEventListener('ended', () => {
            playBtn.textContent = '▶';
            playBtn.classList.remove('is-playing');
        });

        // 进入/离开视口自动播放/暂停
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    video.play().catch(() => {});
                } else {
                    video.pause();
                }
            });
        }, { threshold: 0.5 });

        videoObserver.observe(stage);
    });

    /* ============================================================
       6. 读取 ed.txt 填充页面文案
       页面加载后自动 fetch ed.txt，解析 [section] 键值对，
       将内容动态写入对应 DOM 元素（data-ed 属性标记）
       ============================================================ */
    fetch('ed.txt')
        .then(res => {
            if (!res.ok) throw new Error('ed.txt 加载失败');
            return res.text();
        })
        .then(text => {
            const data = parseEdTxt(text);
            applyEdData(data);
        })
        .catch(() => {
            // ed.txt 不存在或读取失败时静默降级，使用 HTML 中的默认文案
            console.log('ed.txt 未找到，使用页面默认文案');
        });

    /**
     * 解析 ed.txt 为结构化对象
     * 格式：[section] \n key=value
     */
    function parseEdTxt(text) {
        const data = {};
        const lines = text.split('\n');
        let currentSection = null;

        lines.forEach(line => {
            const trimmed = line.trim();
            // 跳过空行和注释
            if (!trimmed || trimmed.startsWith('#')) return;

            // 匹配 [section]
            const sectionMatch = trimmed.match(/^\[(.+)\]$/);
            if (sectionMatch) {
                currentSection = sectionMatch[1];
                data[currentSection] = {};
                return;
            }

            // 匹配 key=value
            const kvMatch = trimmed.match(/^(.+?)=(.+)$/);
            if (kvMatch && currentSection) {
                data[currentSection][kvMatch[1].trim()] = kvMatch[2].trim();
            }
        });

        return data;
    }

    /**
     * 将解析后的数据写入页面
     * 查找带有 data-ed="section.key" 属性的元素并填充内容
     */
    function applyEdData(data) {
        document.querySelectorAll('[data-ed]').forEach(el => {
            const key = el.dataset.ed; // 格式："section.key"
            const [section, field] = key.split('.');
            if (data[section] && data[section][field] !== undefined) {
                // 如果是标题类元素，直接替换文本
                if (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' ||
                    el.classList.contains('eyebrow') || el.classList.contains('hero-lead') ||
                    el.classList.contains('hero-note')) {
                    el.textContent = data[section][field];
                } else {
                    // 其他元素追加或替换
                    el.textContent = data[section][field];
                }
            }
        });
    }

    /* ============================================================
       7. 自动扫描文件夹素材并渲染
       通过预定义素材清单，动态生成作品卡片。
       纯前端限制：无法真正扫描目录，使用预设文件列表模拟。
       素材渲染函数供外部调用，可扩展。
       ============================================================ */

    /**
     * 素材清单：定义每个分类下的素材文件
     * 新增作品只需在此数组中添加对象即可自动渲染
     */
    const assetManifest = {
        videos: {
            microfilm: [
                { file: 'assets/videos/片段7_夏.mp4', title: '《夏的第三章》', tag: '微电影' },
                { file: 'assets/videos/片段2_向北.mp4', title: '《你向北走啊走》', tag: '微电影' }
            ],
            documentary: [
                { file: 'assets/videos/片段7_九黎.mp4', title: '《苗韵天成·九黎印象》', tag: '纪录片' },
                { file: 'assets/videos/片段2_解忧.mp4', title: '《解忧防空洞》', tag: '微纪录片' }
            ],
            ad: [
                { file: 'assets/videos/片段1+2_荔枝肌.mp4', title: '《邂逅"荔枝"肌》', tag: '商业广告' },
                { file: 'assets/videos/片段1_郁美净.mp4', title: '《有棱角不"油"虑》', tag: '商业广告' },
                { file: 'assets/videos/片段1_可画.mp4', title: '《一键换型，可画随行》', tag: '商业广告' },
                { file: 'assets/videos/片段1+2_爱守护.mp4', title: '《让爱无碍，为爱守护》', tag: '公益广告' }
            ],
            short: [
                { file: 'assets/videos/片段_传媒人.mp4', title: '《奔跑吧！传媒人》', tag: '原创短片' },
                { file: 'assets/videos/片段_晴天.mp4', title: '《晴天》', tag: '影音MV' },
                { file: 'assets/videos/片段_重庆24h.mp4', title: '《重庆24h：山·人·光的诗》', tag: '原创短片' },
                { file: 'assets/videos/片段_citywalk.mp4', title: '《我在重庆Citywalk》', tag: '创意短片' },
                { file: 'assets/videos/片段_湖广会馆.mp4', title: '《湖广会馆》', tag: '文旅纪实' }
            ]
        },
        operate: {
            ip: [
                { folder: 'weng0', platform: '抖音', name: '翁0' },
                { folder: 'chouchou', platform: '小红书', name: '丑丑小幺' },
                { folder: 'naituan', platform: '矩阵', name: '奶团咪' }
            ]
        },
        writing: {
            script: ['赎罪', '你向北走啊走', '夏的第三章', '时间商铺'],
            paper: ['具身传播视角', '叙事沉浸与价值共生', '算法垄断与分配失衡', 'AI与内容多样性'],
            planning: ['无限推理', '回信有声', '二十四节气·株洲风物', '株洲职教城', '100人', '神树下的时代', '最后的回声']
        }
    };

    // 将素材清单挂载到 window，方便调试和扩展
    window.__assetManifest = assetManifest;

    /**
     * 根据清单动态渲染视频卡片到指定容器
     * @param {string} containerId - 目标容器ID
     * @param {Array} items - 素材数组
     */
    function renderVideoCards(containerId, items) {
        const container = document.getElementById(containerId);
        if (!container || !items) return;

        const list = container.querySelector('.video-work-list');
        if (!list) return;

        // 清空现有内容后重新渲染
        list.innerHTML = '';

        items.forEach((item, index) => {
            const isReverse = index % 2 === 1; // 偶数正向，奇数反向
            const article = document.createElement('article');
            article.className = 'video-work' + (isReverse ? ' video-work--reverse' : '');
            article.innerHTML = `
                <div class="video-work__stage" data-video-src="${item.file}">
                    <video class="video-work__player" src="${item.file}" muted loop playsinline></video>
                    <div class="video-work__overlay">
                        <span class="video-work__tag">${item.tag}</span>
                        <h2 class="video-work__title">${item.title}</h2>
                        <p class="video-work__sub">${item.sub || ''}</p>
                    </div>
                    <button class="video-work__play" type="button" aria-label="播放片段">▶</button>
                </div>
                <div class="video-work__info">
                    <div class="video-work__role"><span class="eyebrow">担任职务</span><p>${item.role || ''}</p></div>
                    <div class="video-work__desc"><p>${item.desc || ''}</p></div>
                    <div class="video-work__actions">
                        ${item.link ? `<a class="video-work__link" href="${item.link}" target="_blank" rel="noreferrer">观看成片 →</a>` : ''}
                        ${item.download ? `<a class="video-work__link video-work__link--alt" href="${item.download}" target="_blank" rel="noreferrer">下载片段</a>` : ''}
                    </div>
                </div>
            `;
            list.appendChild(article);
        });

        // 为新渲染的卡片重新绑定事件
        container.querySelectorAll('.video-work__stage').forEach(stage => {
            const videoSrc = stage.dataset.videoSrc;
            if (!videoSrc) return;

            stage.addEventListener('click', (e) => {
                if (e.target.closest('.video-work__play')) return;
                openModal(videoSrc);
            });

            stage.setAttribute('tabindex', '0');
            stage.setAttribute('role', 'button');
            stage.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openModal(videoSrc);
                }
            });

            // 内联播放控制
            const video = stage.querySelector('.video-work__player');
            const playBtn = stage.querySelector('.video-work__play');
            if (!video || !playBtn) return;

            const toggle = () => {
                if (video.paused) {
                    if (video.readyState < 2) {
                        playBtn.textContent = '⏳';
                        video.load();
                        video.addEventListener('canplay', function handler() {
                            video.removeEventListener('canplay', handler);
                            video.play().catch(() => {});
                            playBtn.textContent = '⏸';
                            playBtn.classList.add('is-playing');
                        }, { once: true });
                    } else {
                        video.play().catch(() => {});
                        playBtn.textContent = '⏸';
                        playBtn.classList.add('is-playing');
                    }
                } else {
                    video.pause();
                    playBtn.textContent = '▶';
                    playBtn.classList.remove('is-playing');
                }
            };

            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggle();
            });

            video.addEventListener('ended', () => {
                playBtn.textContent = '▶';
                playBtn.classList.remove('is-playing');
            });

            const obs = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        video.play().catch(() => {});
                    } else {
                        video.pause();
                    }
                });
            }, { threshold: 0.5 });

            obs.observe(stage);
        });
    }

    // 暴露渲染函数
    window.renderVideoCards = renderVideoCards;

    console.log('作品集交互脚本已就绪');
    console.log('  - 视频弹窗：点击视频舞台打开全屏播放');
    console.log('  - 板块切换：大标签 + 子分类标签联动');
    console.log('  - ed.txt：自动读取内容数据文件');
    console.log('  - 素材清单：window.__assetManifest 可查看/扩展');
});
