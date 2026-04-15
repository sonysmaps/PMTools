/**
 * Excelファイル「No.6_眺めようチェックリスト.xlsx」内のデータをここに転記してください。
 * 各オブジェクトは { phase: "フェーズ名", caution: "注意点", solution: "対策" } の形式です。
 */
const checklistData = [
    {
        phase: "プロジェクトの立ち上げ",
        caution: "プロジェクトの目的やスコープが不明確なまま進行してしまう。",
        solution: "ステークホルダーとキックオフミーティングを実施し、共通認識を作る。"
    },
    {
        phase: "プロジェクトの立ち上げ",
        caution: "プロジェクト計画書の作成/予算の確保",
        solution: "プロジェクト計画書を作成し、必要な予算を確保しているか？"
    },
    {
        phase: "プロジェクトの立ち上げ",
        caution: "プロジェクト計画書の作成/予算の確保",
        solution: "（プロジェクト計画書への主な記載項目）プロジェクトを立ち上げる理由、背景、プロジェクトが目指す目的、目標（数値目標と数値以外の目標）、費用、体制、対象となる業務、開発するシステムの概要、現在の状況、想定しているシステム像（環境、構成、ネットワーク）　等"
    },
    {
        phase: "プロジェクトの立ち上げ",
        caution: "プロジェクト計画書の作成/予算の確保",
        solution: "発注側の体制、サポート体制等巻き込むべき関係者の選定ができているか？"
    },
    {
        phase: "プロジェクトの計画",
        caution: "【要データ入力】スケジュールに関する注意点などを入力します。",
        solution: "【要データ入力】WBSの作成やマイルストーンの明確化などの対策を入力します。"
    },
    {
        phase: "プロジェクトの実行・監視",
        caution: "【要データ入力】進捗遅れや品質の低下に関する注意点など。",
        solution: "【要データ入力】定期的な進捗会議の実施、課題管理表の運用など。"
    },
    {
        phase: "プロジェクトの終結",
        caution: "【要データ入力】検収漏れやドキュメントの散逸など。",
        solution: "【要データ入力】完了報告書の作成と、教訓のチーム内共有など。"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const selectElement = document.getElementById('phase-select');
    const container = document.getElementById('content-container');

    // 初期表示（すべて表示）
    renderCards('すべて');

    // プルダウン変更時のイベントリスナー
    selectElement.addEventListener('change', (event) => {
        const selectedPhase = event.target.value;
        renderCards(selectedPhase);
    });

    /**
     * データを元にカードを生成して画面に描画する
     * @param {string} filterPhase - 絞り込むフェーズ（'すべて' の場合は全件表示）
     */
    function renderCards(filterPhase) {
        // コンテナをクリア
        container.innerHTML = '';

        // フィルタリング
        const filteredData = filterPhase === 'すべて'
            ? checklistData
            : checklistData.filter(item => item.phase === filterPhase);

        if (filteredData.length === 0) {
            container.innerHTML = '<div class="no-data">該当するフェーズのデータがありません。</div>';
            return;
        }

        // カードを生成して追加
        filteredData.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';

            card.innerHTML = `
                <span class="card-phase">${escapeHTML(item.phase)}</span>
                <div class="card-caution">
                    <h3>注意すべき事項</h3>
                    <p>${escapeHTML(item.caution)}</p>
                </div>
                <div class="card-solution">
                    <h3>その対策</h3>
                    <p>${escapeHTML(item.solution)}</p>
                </div>
            `;
            container.appendChild(card);
        });
    }

    /**
     * XSS対策のための文字列エスケープ
     */
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
    }
});
