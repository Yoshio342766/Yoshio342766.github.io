let allData = [];

window.addEventListener('DOMContentLoaded', async () => {
    try {
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
            time: values[2] || '', // 3列目: 時間
            lat:  values[4] || '', // 5列目: 緯度
            lng:  values[5] || ''  // 6列目: 経度
        };
    });
}

// 検索フィルターとソートを同時に行い、画面に描画する関数
function filterAndRender() {
    const searchBox = document.getElementById('searchBox');
    const query = searchBox.value.replace(/　/g, ' ').toLowerCase().trim();
    
    let filteredData = [...allData]; // 元データを汚さないようにコピー

    // 1. 検索キーワードによる絞り込み
    if (query) {
        const keywords = query.split(/\s+/);
        filteredData = filteredData.filter(item => {
            return keywords.every(keyword => {
                return item.date.toLowerCase().includes(keyword) || 
                       item.name.toLowerCase().includes(keyword) || 
                       item.time.toLowerCase().includes(keyword);
            });
        });
    }

    // 2. ラジオボタンの状態による日付ソート
    const sortType = document.querySelector('input[name="dateSort"]:checked').value;
    filteredData.sort((a, b) => {
        if (a.date < b.date) return sortType === 'asc' ? -1 : 1;
        if (a.date > b.date) return sortType === 'asc' ? 1 : -1;
        return 0;
    });

    // 3. 画面に描画
    renderTable(filteredData);
}

// データを画面に表示するオブジェクト生成関数
function renderTable(data) {
    const tbody = document.getElementById('resultBody');
    const metaInfo = document.getElementById('metaInfo');
    tbody.innerHTML = '';

    // 件数表示の更新
    metaInfo.textContent = `全 ${allData.length} 件中、${data.length} 件を表示しています。`;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="no-result">該当するデータが見つかりません。</td></tr>`;
        return;
    }

    // 行の生成（indexを使って1からの連番を作成）
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.date}</td>
            <td>${item.name}</td>
            <td>${item.time}</td>
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
                const mapUrl = 'https://google.com' + item.lat + ',' + item.lng;
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
