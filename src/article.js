const init = async function(){
    await pweSettings.ready;

    const settings = await pweSettings.getAll();

    // 套件重新啟用時重新載入頁面
    if ($qs('html.pwe')) { window.location.reload(); }
    $qs('html').classList.add('pwe');

    processPushUserid();

    if(settings.showFloor) showFloor();

    pushTitleFloor();

    if(settings.countPushStatistics) countPushStatistics();

    highlightPush.on();

    if(settings.highlightPosterUserid) highlightPosterUserid();

    if(settings.resizeImage) resizeImage();

    if(settings.clickToDownloadImage) clickToDownloadImage();

    if(settings.navbarAutohide) navbarAutohide();

    if(settings.detectThread) detectThread();

    boardNameLink();
};

//顯示通知訊息
const notify = (() => {
    const pweNotify = document.createElement('div');
    pweNotify.classList.add('pwe-notify', 'pwe-hidden');
    $qs('body').insertBefore(pweNotify, null);
    let notifyTimeoutId = undefined;

    return message => {
        //移除原有的timeout
        if(notifyTimeoutId) {
            clearTimeout(notifyTimeoutId);
            notifyTimeoutId = undefined;
        }
        //顯示訊息，並定時移除
        pweNotify.textContent = message;
        pweNotify.classList.remove('pwe-hidden');
        notifyTimeoutId = setTimeout(function(){
            pweNotify.classList.add('pwe-hidden');
        }, 5000);
    };
})();

//幫所有推文id加上class，方便後續select
const processPushUserid = function(){
    $qsa('.push-userid').forEach(pushUserid => {
        const userid = pushUserid.innerHTML.trim(); //此則推文id
        pushUserid.classList.add('pwe-userid-'+userid);
    });
};

//顯示樓層
const showFloor = function(){
    $qsa('.push').forEach((push, index) => {
        const floor = document.createElement('span');
        floor.classList.add('pwe-floor');
        if((index+1) % 5 == 0) floor.classList.add('pwe-floor-multiple-5'); //5的倍數樓層
        const textnode = document.createTextNode(`${index+1}樓`);
        floor.appendChild(textnode);
        push.insertBefore(floor, push.childNodes[0]);
    });
};

//指到推文顯示樓層、第幾推/噓/箭頭
const pushTitleFloor = function(){
    const pushCount = {
        good: 0,
        bad: 0,
        normal: 0,
    };

    $qsa('.push').forEach((push, index) => {
        const pushTagText = $qs('.push-tag', push).innerHTML;

        push.title = `${index+1}樓，`;
        if (pushTagText == '推 ') {
            pushCount.good++;
            push.title = push.title + `第${pushCount.good}推`;
        }
        if (pushTagText == '噓 ') {
            pushCount.bad++;
            push.title = push.title + `第${pushCount.bad}噓`;
        }
        if (pushTagText == '→ ') {
            pushCount.normal++;
            push.title = push.title + `第${pushCount.normal}箭頭`;
        }
    });
};

//推文統計
const countPushStatistics = function(){
    //推文數量統計用
    const pushCount = {
        good: 0,
        bad: 0,
        normal: 0,
    };

    //統計推/噓/→
    $qsa('.push-tag').forEach(pushTag => {
        const pushTagText = pushTag.innerHTML;
        if (pushTagText == '推 ') pushCount.good++;
        if (pushTagText == '噓 ') pushCount.bad++;
        if (pushTagText == '→ ') pushCount.normal++;
    });

    //在文章後面顯示推文統計結果
    const pushStatistics = document.createElement('div');
    pushStatistics.classList.add('pwe-push-statistics');
    pushStatistics.textContent = `推噓文統計：推=${pushCount.good}, 噓=${pushCount.bad}, →=${pushCount.normal}`;
    $qs('#main-container').insertBefore(pushStatistics, $qs('#article-polling'));
};

//點選推文時，將相同id的推文高亮度顯示
const highlightPush = (function(){
    let active; //此功能開啟狀態
    let selectedUserid = null; //點選的推文id

    //開啟此項功能
    const on = function(){
        if (active === true) return;
        active = true;

        $qsa('.push').forEach(push => {
            const userid = $qs('.push-userid', push).innerHTML; //此則推文id
    
            push.addEventListener('click', function(){
                toggleHl(userid);
            });
        });
    };

    //將userid的推文加上高亮度，同時會關閉其他id的高亮度
    const setHl = function(userid){
        if (!active) return false;

        //已經是目前高亮度的id，不用做事
        if (userid == selectedUserid) return;

        //移除目前的高亮度
        removeHl();

        //新增高亮度
        $qsa('.pwe-userid-'+userid).forEach(userid => {
            userid.parentElement.classList.add('pwe-highlight-push');
        });

        //更新目前選擇的id
        selectedUserid = userid;
    };

    //移除原有高亮度
    const removeHl = function(){
        if (!active) return false;

        //移除高亮度
        $qsa('.pwe-highlight-push').forEach(highlight => {
            highlight.classList.remove('pwe-highlight-push');
        });

        //更新目前選擇的id
        selectedUserid = null;
    };

    //切換某id的高亮度狀態。開啟一個id的高亮度會關閉其他id的高亮度。
    const toggleHl = function(userid){
        if (!active) return false;

        if (selectedUserid === userid) {
            //假如點選的id是目前高亮度的id，就取消高亮度
            removeHl();
        } else {
            //假如點選的id不是目前高亮度的id，就加上高亮度
            setHl(userid);
        }
    };

    return { on, setHl, removeHl, toggleHl };
})();

//放大圖片
const resizeImage = function(){
    //對所有圖片進行處理
    $qsa('.richcontent').forEach(richcontent => {
        const img = $qs('img', richcontent);
        if(!img) return;

        //增加class，以套用CSS
        richcontent.classList.add('pwe-richcontent-resize');
    });
};

//點選圖片進行下載
const clickToDownloadImage = function(){
    //對所有圖片進行處理
    $qsa('.richcontent img').forEach(img => {
        img.classList.add('pwe-clickable'); //指到圖片時滑鼠指標變成手

        //點選圖片時進行下載
        img.addEventListener('click', function(){
            //通知背景程式進行下載
            browser.runtime.sendMessage({
                url: img.src
            }).then(function(filename){
                //顯示下載完成訊息
                notify(`圖片已下載至${filename}`);
            });
        });    
    });
};

//頂部和底部導覽列自動隱藏
const navbarAutohide = function(){
    $qs('#topbar-container').classList.add('pwe-autohide');
    $qs('#navigation-container').classList.add('pwe-autohide');
};

//自動連結討論串
const detectThread = function(){
    const getArticleId = function(url){
        /\/\w\.(\d+)\.[\w.]+$/.test(url.pathname);
        return RegExp.$1;
    };

    const getArticleTitleToken = function(title){
        /^(?:Re: ?)*(.*)$/i.test(title);
        return RegExp.$1;
    };

    const fetchDocument = function(url){
        return fetch(url, {credentials: 'include'}).then(response => {
            return response.text();
        }).then(text => {
            return new DOMParser().parseFromString(text, 'text/html');
        });
    };

    const fetchListPageDocument = function(index){
        // index == undefined 為最後一頁
        return fetchDocument(new URL(`index${index || ""}.html`, curUrl));
    };

    const fetchArticles = function(doc, method = 'all'){
        var elems = $qsa('.r-list-container .r-ent .title a, .r-list-container .r-list-sep', doc);
        var sepIndex = elems.findIndex(x => x.classList.contains('r-list-sep'));
        if (sepIndex !== -1) { elems = elems.slice(0, sepIndex); }

        switch (method) {
            case 'all':
                return elems.map(elem => ({
                    id: getArticleId(new URL(elem.href, curUrl)),
                    title: elem.textContent,
                    href: elem.href,
                }));
            case 'first':
                var elem = elems[0];
                if (!elem) { return null; }
                return {
                    id: getArticleId(new URL(elem.href, curUrl)),
                    title: elem.textContent,
                    href: elem.href,
                };
            case 'last':
                var elem = elems.pop();
                if (!elem) { return null; }
                return {
                    id: getArticleId(new URL(elem.href, curUrl)),
                    title: elem.textContent,
                    href: elem.href,
                };
        }
        return null;
    };

    const seekArticlePage = function(firstPage, lastPage){
        var searchNext = function(){
            // 二分搜尋法
            var articlePageGuess = Math.floor(firstPage + (lastPage - firstPage) / 2);
            if (articlePageGuess === articlePage) { articlePageGuess++; }
            articlePage = articlePageGuess;

            return fetchListPageDocument(articlePageGuess).then(doc => {
                articles = fetchArticles(doc, 'all');
                var minId = articles[0].id;
                var maxId = articles[articles.length - 1].id;

                if (articleId < minId) {
                    if (firstPage === lastPage) {
                        // 此 ID 的文章不存在
                        return -1;
                    }
                    lastId = minId;
                    lastPage = articlePageGuess;
                    return searchNext();
                } else if (articleId > maxId) {
                    if (firstPage === lastPage) {
                        // 此 ID 的文章不存在
                        return -1;
                    }
                    firstId = maxId;
                    firstPage = articlePageGuess;
                    return searchNext();
                } else {
                    var article = articles.find(x => x.id === articleId);
                    if (!article) {
                        // 此 ID 的文章不存在
                        return -1;
                    }
                    return articlePageGuess;
                }
            });
        };

        return searchNext();
    };

    const seekPrevPage = function(){
        var searchNext = function(){
            if (--page < pageMin) { return null; }
            return fetchListPageDocument(page).then(doc => {
                let prev = fetchArticles(doc, 'all').reverse().find(x => getArticleTitleToken(x.title) === getArticleTitleToken(article.title));
                if (prev) { return prev; }
                return searchNext();
            });
        };

        let prev = articles.slice(0, articleIndex).find(x => getArticleTitleToken(x.title) === getArticleTitleToken(article.title));
        if (prev) { return Promise.resolve(prev); }
        let page = articlePage, pageMin = Math.max(page - 4, firstPage);
        return searchNext();
    };

    const seekNextPage = function(){
        var searchNext = function(){
            if (++page > pageMax) { return null; }
            return fetchListPageDocument(page).then(doc => {
                let next = fetchArticles(doc, 'all').find(x => getArticleTitleToken(x.title) === getArticleTitleToken(article.title));
                if (next) { return next; }
                return searchNext();
            });
        };

        let next = articles.slice(articleIndex + 1).find(x => getArticleTitleToken(x.title) === getArticleTitleToken(article.title));
        if (next) { return Promise.resolve(next); }
        let page = articlePage, pageMax = Math.min(page + 4, lastPage);
        return searchNext();
    };

    var curUrl = new URL(location.href);
    var articles,
        articleId = getArticleId(curUrl), articlePage = -1, article, articleIndex,
        firstId, firstPage = 1,
        lastId, lastPage;

    return Promise.resolve().then(() => {
        return fetchListPageDocument(1).then(doc => {
            firstId = fetchArticles(doc, 'first').id;
        });
    }).then(() => {
        return fetchListPageDocument().then(doc => {
            lastId = fetchArticles(doc, 'last').id;
            /\/index(\d+)\.html$/.test($qsa('.btn-group-paging a.btn', doc)[1].href);
            lastPage = parseInt(RegExp.$1, 10) + 1;
        });
    }).then(() => {
        return seekArticlePage(firstPage, lastPage).then(articlePageIndex => {
            articlePage = articlePageIndex;
            if (articlePage === -1) { throw new Error(`'${curUrl}' 頁面不存在`); }

            // 重導向「返回看板」
            let newUrl = new URL(`index${articlePage}.html`, curUrl);
            $qsa('a.board').forEach(elem => {
              elem.href = newUrl.pathname;
            });

            articleIndex = articles.findIndex(x => x.id === articleId);
            article = articles[articleIndex];
        });
    }).then(() => {
        return Promise.all([seekPrevPage(), seekNextPage()]).then(([prevPage, nextPage]) => {
            if (prevPage) {
                var prevPageElem = document.createElement('a');
                prevPageElem.href = prevPage.href;
            } else {
                var prevPageElem = document.createElement('del');
            }
            prevPageElem.classList.add('pwe-thread');
            prevPageElem.textContent = '上一篇';
            $qs('#navigation').insertBefore(prevPageElem, $qs('#navigation .bar'));

            if (nextPage) {
                var nextPageElem = document.createElement('a');
                nextPageElem.href = nextPage.href;
            } else {
                var nextPageElem = document.createElement('del');
            }
            nextPageElem.classList.add('pwe-thread');
            nextPageElem.textContent = '下一篇';
            $qs('#navigation').insertBefore(nextPageElem, $qs('#navigation .bar'));
        });
    }).catch(ex => {
      console.error(ex);
    });
};

//作者的推文使用較明顯的箭頭
const highlightPosterUserid = function(){
    let posterUserid = undefined; //文章作者id

    //找出文章作者
    $qsa('.article-metaline').forEach(articleMetaline => {
        if ($qs('.article-meta-tag', articleMetaline).innerHTML == '作者') {
            const pattern = /\w+/;
            const matches = $qs('.article-meta-value', articleMetaline).innerHTML.match(pattern);
            if(matches) posterUserid = matches[0];
        }
    });

    //把文章作者的箭頭加上class
    if (posterUserid) {
        $qsa('.pwe-userid-'+posterUserid).forEach(userid => {
            const pushTag = $qs('.push-tag', userid.parentElement);
            pushTag.classList.add('pwe-poster-push-tag');
        });
    }

    //把文章作者的推文加上高亮度
    highlightPush.setHl(posterUserid);
};

//文章右上角的板名增加連到看板的連結
const boardNameLink = function(){
    //因為文章格式可能被作者修改，所以會做各種檢查

    const articleMetalineRight = $qs('.article-metaline-right');
    if (!articleMetalineRight) return;

    const articleMetaTag = $qs('.article-meta-tag', articleMetalineRight);
    if (!articleMetaTag || articleMetaTag.innerHTML.trim() != '看板') return;
    
    const articleMetaValue = $qs('.article-meta-value', articleMetalineRight);
    if (!articleMetaValue) return;

    const board = articleMetaValue.innerHTML.trim();
    if (!board.match(/[\w-]+/)) return;

    const anchor = document.createElement('a');
    anchor.href = `/bbs/${board}/index.html`;
    anchor.textContent = board;
    anchor.classList.add('pwe-board');
    articleMetaValue.innerHTML = '';
    articleMetaValue.appendChild(anchor);
};

init();
