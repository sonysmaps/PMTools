document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const selectElement = document.getElementById('phase-select');
    const hideUncheckedToggle = document.getElementById('hide-unchecked');
    const container = document.getElementById('content-container');
    
    // Admin Elements
    const addFormWrapper = document.getElementById('add-form-wrapper');
    const addItemToggle = document.getElementById('add-item-toggle');
    const checklistForm = document.getElementById('checklist-form');
    const formCancel = document.getElementById('form-cancel');
    const exportBtn = document.getElementById('export-json');
    const importInput = document.getElementById('import-json');

    // State
    let checklistData = [];
    let selectedIds = [];
    let hideUnchecked = false;

    // Initialization
    init();

    async function init() {
        // 1. 設定の読み込み
        hideUnchecked = localStorage.getItem('pm-tools-hide-unchecked') === 'true';
        hideUncheckedToggle.checked = hideUnchecked;
        
        // 2. データの読み込み
        const savedData = localStorage.getItem('pm-tools-checklist-data');
        if (savedData) {
            checklistData = JSON.parse(savedData);
        } else {
            try {
                const response = await fetch('data.json');
                if (!response.ok) throw new Error('Failed to load data.json');
                checklistData = await response.json();
                saveToLocalStorage();
            } catch (err) {
                console.error(err);
                checklistData = []; // フォールバック
            }
        }

        // 3. 選択状態の読み込み
        const savedIds = localStorage.getItem('pm-tools-selected-ids');
        selectedIds = savedIds ? JSON.parse(savedIds) : checklistData.map(item => item.id);

        renderList(selectElement.value);
    }

    // --- Event Listeners ---

    // フィルター系
    selectElement.addEventListener('change', () => renderList(selectElement.value));
    
    hideUncheckedToggle.addEventListener('change', (e) => {
        hideUnchecked = e.target.checked;
        localStorage.setItem('pm-tools-hide-unchecked', hideUnchecked);
        renderList(selectElement.value);
    });

    // フォーム開閉
    addItemToggle.addEventListener('click', () => {
        addFormWrapper.classList.toggle('hidden');
        if (!addFormWrapper.classList.contains('hidden')) {
            document.getElementById('form-phase').focus();
        }
    });

    formCancel.addEventListener('click', () => {
        addFormWrapper.classList.add('hidden');
        checklistForm.reset();
    });

    // 新規追加
    checklistForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newItem = {
            id: Date.now(), // 簡易的なユニークID
            phase: document.getElementById('form-phase').value,
            caution: document.getElementById('form-caution').value,
            solution: document.getElementById('form-solution').value
        };

        checklistData.push(newItem);
        selectedIds.push(newItem.id); // デフォルトでチェック状態にする
        
        saveToLocalStorage();
        localStorage.setItem('pm-tools-selected-ids', JSON.stringify(selectedIds));
        
        renderList(selectElement.value);
        
        // フォームを閉じる
        addFormWrapper.classList.add('hidden');
        checklistForm.reset();
    });

    // チェックリストの保存 (場所を選べるように実装)
    exportBtn.addEventListener('click', async () => {
        const dataStr = JSON.stringify(checklistData, null, 4);
        const fileName = `checklist_${new Date().toISOString().split('T')[0]}.json`;

        // 1. File System Access API がサポートされているか確認 (名前を付けて保存ダイアログ)
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{
                        description: 'JSONファイル',
                        accept: { 'application/json': ['.json'] },
                    }],
                });
                const writable = await handle.createWritable();
                await writable.write(dataStr);
                await writable.close();
                return; // 正常終了
            } catch (err) {
                // ユーザによるキャンセル時は何もしない
                if (err.name === 'AbortError') return;
                console.warn('File System Access API が失敗したため、従来のダウンロード方式に切り替えます:', err);
            }
        }

        // 2. フォールバック: 従来のダウンロード方式 (自動でダウンロードフォルダへ)
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    });

    // インポート
    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (Array.isArray(importedData)) {
                    checklistData = importedData;
                    // インポート時は全選択状態にリセット（or 既存の維持）
                    selectedIds = checklistData.map(item => item.id);
                    
                    saveToLocalStorage();
                    localStorage.setItem('pm-tools-selected-ids', JSON.stringify(selectedIds));
                    
                    renderList(selectElement.value);
                    alert('データを読み込みました。');
                }
            } catch (err) {
                alert('JSONファイルの形式が正しくありません。');
            }
        };
        reader.readAsText(file);
    });

    // --- Core Functions ---

    function saveToLocalStorage() {
        localStorage.setItem('pm-tools-checklist-data', JSON.stringify(checklistData));
    }

    function renderList(filterPhase) {
        container.innerHTML = '';

        let filteredData = filterPhase === 'すべて'
            ? checklistData
            : checklistData.filter(item => item.phase === filterPhase);

        if (hideUnchecked) {
            filteredData = filteredData.filter(item => selectedIds.includes(item.id));
        }

        if (filteredData.length === 0) {
            container.innerHTML = '<div class="no-data">表示できる項目がありません。</div>';
            return;
        }

        filteredData.forEach(item => {
            const isChecked = selectedIds.includes(item.id);
            const listItem = document.createElement('div');
            listItem.className = `list-item ${isChecked ? '' : 'is-unchecked'}`;

            listItem.innerHTML = `
                <div class="item-check">
                    <input type="checkbox" id="check-${item.id}" ${isChecked ? 'checked' : ''}>
                </div>
                <div class="item-phase">
                    <span class="list-phase-badge">${escapeHTML(item.phase)}</span>
                </div>
                <div class="item-content">
                    <div class="item-caution">
                        <h3>注意すべき事項</h3>
                        <p>${escapeHTML(item.caution)}</p>
                    </div>
                    <div class="item-solution">
                        <h3>その対策</h3>
                        <p>${escapeHTML(item.solution)}</p>
                    </div>
                </div>
            `;

            const checkbox = listItem.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (!selectedIds.includes(item.id)) selectedIds.push(item.id);
                } else {
                    selectedIds = selectedIds.filter(id => id !== item.id);
                }
                localStorage.setItem('pm-tools-selected-ids', JSON.stringify(selectedIds));
                
                if (hideUnchecked) {
                    renderList(selectElement.value);
                } else {
                    listItem.classList.toggle('is-unchecked', !e.target.checked);
                }
            });

            container.appendChild(listItem);
        });
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
    }
});
