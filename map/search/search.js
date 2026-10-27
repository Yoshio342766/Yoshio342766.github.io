let allData = [];
let headers = [];

window.addEventListener('DOMContentLoaded', async () => {
    try {
        // TSVファイルの読み込み
        const response = await fetch('data.tsv');
        if (!response.ok) throw new Error('ファイルの読み込みに失敗しました');
        
        const text = await response.text();
        parseTSV(text);
        
        // 初期表示
        renderTable(allData);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('metaInfo').textContent = 'データの読み込みエラーが発生しました。';
    }
});

// TSVをパースする関数
function parseTSV(text) {
    // 改行コードの違い（CRLF / LF）に対応
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return;

    // 1行目からヘッダーを取得
    headers = lines[0].split('\t').map(h => h.trim());
    
    // 2行目以降のデータ行をオブジェクトの配列に変換
    allData = lines.slice(1).map(line => {
        const values = line.split('\t').map(v => v.trim());
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || ''; // 値が空なら空文字
        });
        return obj;
    });

    // テーブルのヘッダー（th）を自動生成
    const thead = document.getElementById('tableHead');
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
}

// データを画面に表示する関数
function renderTable(data) {
    const tbody = document.getElementById('resultBody');
    const metaInfo = document.getElementById('metaInfo');
    tbody.innerHTML = '';

    // 件数表示の更新
    metaInfo.textContent = `全 ${allData.length} 件中、${data.length} 件を表示しています。`;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${headers.length}" class="no-result">該当するデータが見つかりません。</td></tr>`;
        return;
    }

    // 行の生成
    data.forEach(item => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = item[header];
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
}

// 検索入力の監視（スペース区切りの多重ワード検索に対応）
document.getElementById('searchBox').addEventListener('input', (e) => {
    // 全角スペースを半角に変換し、小文字にしてから配列に分解
    const query = e.target.value.replace(/　/g, ' ').toLowerCase().trim();
    
    if (!query) {
        renderTable(allData);
        return;
    }

    const keywords = query.split(/\s+/); // 1つ以上のスペースで分割

    // フィルタリング処理
    const filteredData = allData.filter(item => {
        // すべてのキーワード（AND条件）についてチェック
        return keywords.every(keyword => {
            // アイテム内のいずれかの列（項目）にキーワードが含まれているか
            return headers.some(header => {
                return item[header].toLowerCase().includes(keyword);
            });
        });
    });

    renderTable(filteredData);
});
