let allData = [];
let filteredData = [];      // 現在の検索・ソート結果（全件）
let visibleCount = 0;       // 現在表示している件数

// 表示件数の設定（search.json で上書き。読み込み失敗時はこの値を使用）
let initialDisplayCount = 25;
let loadMoreCount = 25;

// 設定ファイル(search.json)の読み込み
async function loadConfig() {
    try {
        const response = await fetch('json/search.json');
        if (!response.ok) throw new Error('設定ファイルの読み込みに失敗しました');
        const config = await response.json();

        const initial = parseInt(config.initialDisplayCount, 10);
        if (initial > 0) initialDisplayCount = initial;

        // loadMoreCount 未指定の場合は初期表示件数と同じにする
        const more = parseInt(config.loadMoreCount, 10);
        loadMoreCount = more > 0 ? more : initialDisplayCount;
    } catch (error) {
        console.warn('設定ファイルを読み込めないため既定値を使用します:', error);
        loadMoreCount = initialDisplayCount;
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadConfig();

        // データファイル読み込み
        const response = await fetch('data/Geocode_places2.tsv');
        if (!response.ok) throw new Error('ファイルの読み込みに失敗しました');
        
        const text = await response.text();
        parseHeaderlessTSV(text);
        
        // 初期表示（検索窓は空なので全件をフィルタ・ソートして表示）
        filterAndRender();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('metaInfo').textContent = 'データの読み込みエラーが発生しました。';
    }
});

// ヘッダーなしTSVをパースする関数
function parseHeaderlessTSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return;
    
    allData = lines.map(line => {
        const values = line.split('\t').map(v => v.trim());
        
        return {
            date: values[0] || '', // 1列目: 日付
            name: values[1] || '', // 2列目: 場所・施設名
            memo: values[2] || '', // 3列目: 備考
            lat:  values[4] || '', // 5列目: 緯度
            lng:  values[5] || '', // 6列目: 経度
            seq:  parseInt(values[6], 10) || 0 // 7列目: SEQ_No（日付ソートの第2キー）
        };
    });
}

// 検索フィルターとソートを同時に行い、画面に描画する関数
function filterAndRender() {
    const searchBox = document.getElementById('searchBox');
    const query = searchBox.value.replace(/　/g, ' ').toLowerCase().trim();
    
    filteredData = [...allData]; // 元データを汚さないようにコピー

    // 1. 検索キーワードによる絞り込み
    if (query) {
        const keywords = query.split(/\s+/);
        filteredData = filteredData.filter(item => {
            return keywords.every(keyword => {
                return item.date.toLowerCase().includes(keyword) || 
                       item.name.toLowerCase().includes(keyword) || 
                       item.memo.toLowerCase().includes(keyword);
            });
        });
    }

    // 2. ラジオボタンの状態による日付ソート
    const sortType = document.querySelector('input[name="dateSort"]:checked').value;
    const dir = sortType === 'asc' ? 1 : -1;
    filteredData.sort((a, b) => {
        // 第1キー: 日付
        if (a.date < b.date) return -1 * dir;
        if (a.date > b.date) return 1 * dir;
        // 第2キー: SEQ_No（数値比較。日付と同じ昇順/降順に従う）
        return (a.seq - b.seq) * dir;
    });

    // 3. 表示件数を初期値に戻して描画（検索・ソート変更時）
    visibleCount = initialDisplayCount;
    renderTable();
}

// 「もっと見る」：表示件数を追加して再描画
function loadMore() {
    visibleCount += loadMoreCount;
    renderTable();
}

// データを画面に表示するオブジェクト生成関数
function renderTable() {
    const tbody = document.getElementById('resultBody');
    const metaInfo = document.getElementById('metaInfo');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    tbody.innerHTML = '';

    const total = allData.length;
    const hit = filteredData.length;
    const query = document.getElementById('searchBox').value.trim();

    if (hit === 0) {
        metaInfo.textContent = query
            ? `全 ${total} 件中、該当 0 件です。`
            : `全 ${total} 件中、0 件です。`;
        loadMoreBtn.hidden = true;
        tbody.innerHTML = `<tr><td colspan="5" class="no-result">該当するデータが見つかりません。</td></tr>`;
        return;
    }

    const shown = Math.min(visibleCount, hit);
    const data = filteredData.slice(0, shown);

    // 件数表示の更新（キーワード入力時は該当件数を明示）
    if (query) {
        metaInfo.textContent = `全 ${total} 件中、該当 ${hit} 件（うち ${shown} 件を表示しています）。`;
    } else {
        metaInfo.textContent = `全 ${total} 件中、${shown} 件を表示しています。`;
    }

    // 「もっと見る」ボタンの表示制御
    const remaining = hit - shown;
    if (remaining > 0) {
        loadMoreBtn.hidden = false;
        loadMoreBtn.textContent = `もっと見る（残り ${remaining} 件）`;
    } else {
        loadMoreBtn.hidden = true;
    }

    // 行の生成（indexを使って1からの連番を作成）
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.date}</td>
            <td>${item.name}</td>
            <td>${item.memo}</td>
        `;
        
        const mapTd = document.createElement('td');
        if (item.lat && item.lng) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'map-link';
            button.textContent = '🗺️ 地図を表示';
            button.style.cursor = 'pointer';
            button.style.border = 'none';
            
            button.addEventListener('click', () => {
                const mapUrl = 'https://google.com/maps/search/?api=1&query=' + item.lat + ',' + item.lng;
                window.open(mapUrl, '_blank', 'noopener,noreferrer');
            });
            
            mapTd.appendChild(button);
        } else {
            mapTd.textContent = '-';
        }
        row.appendChild(mapTd);
        
        tbody.appendChild(row);
    });
}

// イベント監視：検索窓の入力
document.getElementById('searchBox').addEventListener('input', filterAndRender);

// イベント監視：ラジオボタンの切り替え
document.querySelectorAll('input[name="dateSort"]').forEach(radio => {
    radio.addEventListener('change', filterAndRender);
});

// イベント監視：もっと見るボタン
document.getElementById('loadMoreBtn').addEventListener('click', loadMore);
