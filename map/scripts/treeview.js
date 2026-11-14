// treeview.js

document.addEventListener('DOMContentLoaded', () => {
    // 個別データを挿入するためのコンテナ（ulタグ）を取得
    const targetUl = document.getElementById('individual-trip-list');

    if (!targetUl) {
        console.error('挿入先の要素(#individual-trip-list)が見つかりません。');
        return;
    }

    // JSONファイルの読み込み
    fetch('json/treeview.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const treeDetails = data.tree_detail || [];
            if (treeDetails.length === 0) return;

            // 年ごとにデータをグループ化する
            const groupedByYear = treeDetails.reduce((acc, item) => {
                if (!acc[item.year]) {
                    acc[item.year] = [];
                }
                acc[item.year].push(item);
                return acc;
            }, {});

            // 年ごとに <li><details>... を生成して追加
            // （整数キーは自動ソートされるため、元の配列の順序を維持したユニークなキーリストを作成する）
            const orderedYears = [...new Set(treeDetails.map(item => item.year))];
            for (const year of orderedYears) {
                const yearItems = groupedByYear[year];

                // 年の <li> 要素を作成
                const yearLi = document.createElement('li');
                const yearDetails = document.createElement('details');
                const yearSummary = document.createElement('summary');
                yearSummary.textContent = `${year}年`;

                // 年の下にぶら下がるファイルリストの <ul> を作成
                const fileUl = document.createElement('ul');

                // その年の各ファイルの <li> を生成
                yearItems.forEach(item => {
                    const fileLi = document.createElement('li');
                    fileLi.className = 'file';

                    const link = document.createElement('a');
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    link.href = item.url;
                    // 🗾 アイコンとテキストを表示
                    link.textContent = `🗾 ${item.text}`;

                    fileLi.appendChild(link);
                    fileUl.appendChild(fileLi);
                });

                // 組み立てた要素を親に追加
                yearDetails.appendChild(yearSummary);
                yearDetails.appendChild(fileUl);
                yearLi.appendChild(yearDetails);
                targetUl.appendChild(yearLi);
            }
        })
        .catch(error => {
            console.error('treeview.json の読み込みに失敗しました:', error);
            targetUl.innerHTML = '<li>データの読み込みに失敗しました。</li>';
        });
});