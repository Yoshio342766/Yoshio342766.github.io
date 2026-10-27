let allData = [];

window.addEventListener('DOMContentLoaded', async () => {
    try {
        // データファイル名を Geocode_places2.tsv に変更
        const response = await fetch('Geocode_places2.tsv');
        if (!response.ok) throw new Error('ファイルの読み込みに失敗しました');
        
        const text = await response.text();
        parseHeaderlessTSV(text);
        
        // 初期表示
        renderTable(allData);
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
        
        // 各列のデータをオブジェクトに格納
        return {
            date: values[0] || '', // 1列目: 日付
            name: values[1] || '', // 2列目: 場所・施設名
            time: values[2] || '', // 3列目: 時間
            lat:  values[4] || '', // 5列目: 緯度
            lng:  values[5] || ''  // 6列目: 経度
        };
    });
}

// データを画面に表示する関数
function renderTable(data) {
    const tbody = document.getElementById('resultBody');
    const metaInfo = document.getElementById('metaInfo');
    tbody.innerHTML = '';

    // 件数表示の更新
    metaInfo.textContent = `全 ${allData.length} 件中、${data.length} 件を表示しています。`;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="no-result">該当するデータが見つかりません。</td></tr>`;
        return;
    }

    // 行の生成
    data.forEach(item => {
        const row = document.createElement('tr');
        
        // 1~3列目（テキスト情報）の追加
        row.innerHTML = `
            <td>${item.date}</td>
            <td>${item.name}</td>
            <td>${item.time}</td>
        `;
        
        // 4列目（Googleマップリンク）の生成
        const mapTd = document.createElement('td');
        if (item.lat && item.lng) {
            mapTd.innerHTML = `<a href="https://google.com{item.lat},${item.lng}" target="_blank" class="map-link">🗺️ 地図を表示</a>`;
        } else {
            mapTd.textContent = '-';
        }
        row.appendChild(mapTd);
        
        tbody.appendChild(row);
    });
}

// 検索入力の監視（スペース区切りの多重ワード検索に対応）
document.getElementById('searchBox').addEventListener('input', (e) => {
    const query = e.target.value.replace(/　/g, ' ').toLowerCase().trim();
    
    if (!query) {
        renderTable(allData);
        return;
    }

    const keywords = query.split(/\s+/);

    // フィルタリング処理（日付、場所、時間から検索）
    const filteredData = allData.filter(item => {
        return keywords.every(keyword => {
            return item.date.toLowerCase().includes(keyword) || 
                   item.name.toLowerCase().includes(keyword) || 
                   item.time.toLowerCase().includes(keyword);
        });
    });

    renderTable(filteredData);
});
