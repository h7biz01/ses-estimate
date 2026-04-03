'use strict';

// =====================================================================
// デフォルト値
// =====================================================================
function defaultFormData() {
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  return {
    issueDate:         `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`,
    clientName:        '',
    orderCompanyName:  '',
    businessContent:   '業務支援及びそれに付随する業務',
    workLocation:      '貴社指定場所',
    startDate:         '',
    endDate:           '',
    startTime:         '10:00',
    endTime:           '19:00',
    breakTime:         '01:00',
    weeklyDays:        5,
    contractType:      '業務委託',
    paymentType:       '月給',
    paymentSite:       30,
    settlementType:    '中央割',
    baseHoursOverride: 0,
    deductionRange:    20,
    excessRange:       20,
    timeUnit:          15,
    timeInterval:      '日ごと',
    roundingType:      '切捨て',
    autoRenewal:       '無',
    autoRenewalPeriod: '',
    travelIncluded:    true,
    travelNote:        '',
    businessTripNote:  '',
    isBP:              false,
    isReceipt:         false,
    isMultiWorker:     false,
    isDailyCalc:       false,
    dailyStartDate:    '',
    dailyEndDate:      '',
    dailyWorkDays:     '',
    managementNo:      '',
    workers: [
      {name:'',nameKana:'',weeklyDays:5,unitPrice:0},
      {name:'',nameKana:'',weeklyDays:5,unitPrice:0},
      {name:'',nameKana:'',weeklyDays:5,unitPrice:0},
      {name:'',nameKana:'',weeklyDays:5,unitPrice:0},
      {name:'',nameKana:'',weeklyDays:5,unitPrice:0},
    ],
  };
}

function defaultSettings() {
  return {
    companyName: '株式会社ワンゴジュウゴ',
    address:     '〒102-0094\n東京都千代田区紀尾井町3-6\n紀尾井町パークビル7F',
    tel:         '03-3234-5576',
    sbUrl:       '',
    sbKey:       '',
  };
}

// =====================================================================
// 状態
// =====================================================================
let formData   = defaultFormData();
let settings   = defaultSettings();
let currentRecordId   = null;  // 現在読み込み中のDB ID
let currentRecordTitle= '';

// =====================================================================
// localStorage
// =====================================================================
function saveToStorage() {
  try {
    localStorage.setItem('ses_form',     JSON.stringify(formData));
    localStorage.setItem('ses_settings', JSON.stringify(settings));
  } catch(e) {}
}
function loadFromStorage() {
  try {
    const f = localStorage.getItem('ses_form');
    const s = localStorage.getItem('ses_settings');
    if (f) formData  = Object.assign(defaultFormData(),  JSON.parse(f));
    if (s) settings  = Object.assign(defaultSettings(),  JSON.parse(s));
  } catch(e) {}
}

// =====================================================================
// フォーム ↔ 状態 同期
// =====================================================================
function gv(id)  { const e=document.getElementById(id); return e ? e.value : ''; }
function gb(id)  { const e=document.getElementById(id); return e ? e.checked : false; }
function sv(id,v){ const e=document.getElementById(id); if(e) e.value = v ?? ''; }
function sb(id,v){ const e=document.getElementById(id); if(e) e.checked = !!v; }

function readForm() {
  formData.issueDate        = gv('issueDate');
  formData.clientName       = gv('clientName');
  formData.orderCompanyName = gv('orderCompanyName');
  formData.businessContent  = gv('businessContent');
  formData.workLocation     = gv('workLocation');
  formData.startDate        = gv('startDate');
  formData.endDate          = gv('endDate');
  formData.startTime        = gv('startTime');
  formData.endTime          = gv('endTime');
  formData.breakTime        = gv('breakTime');
  formData.weeklyDays       = parseInt(gv('weeklyDays'))   || 5;
  formData.contractType     = gv('contractType');
  formData.paymentType      = gv('paymentType');
  formData.paymentSite      = parseInt(gv('paymentSite'))  || 30;
  formData.settlementType   = gv('settlementType');
  formData.baseHoursOverride= parseInt(gv('baseHoursOverride')) || 0;
  formData.deductionRange   = parseInt(gv('deductionRange')) || 0;
  formData.excessRange      = parseInt(gv('excessRange'))    || 0;
  formData.timeUnit         = parseInt(gv('timeUnit'))       || 15;
  formData.timeInterval     = gv('timeInterval');
  formData.roundingType     = gv('roundingType');
  formData.autoRenewal      = gv('autoRenewal');
  formData.autoRenewalPeriod= gv('autoRenewalPeriod');
  formData.travelIncluded   = gb('travelIncluded');
  formData.travelNote       = gv('travelNote');
  formData.businessTripNote = gv('businessTripNote');
  formData.isBP             = gb('isBP');
  formData.isReceipt        = gb('isReceipt');
  formData.isMultiWorker    = gb('isMultiWorker');
  formData.isDailyCalc      = gb('isDailyCalc');
  formData.dailyStartDate   = gv('dailyStartDate');
  formData.dailyEndDate     = gv('dailyEndDate');
  formData.dailyWorkDays    = gv('dailyWorkDays');
  formData.managementNo     = gv('managementNo');

  for (let i = 0; i < 5; i++) {
    formData.workers[i].name       = gv(`w${i}_name`);
    formData.workers[i].nameKana   = gv(`w${i}_kana`);
    formData.workers[i].weeklyDays = parseInt(gv(`w${i}_days`)) || formData.weeklyDays;
    formData.workers[i].unitPrice  = parseInt(gv(`w${i}_price`)) || 0;
  }

  settings.companyName = gv('s_companyName');
  settings.address     = gv('s_address');
  settings.tel         = gv('s_tel');
  settings.sbUrl       = gv('s_sbUrl');
  settings.sbKey       = gv('s_sbKey');
}

function writeForm() {
  sv('issueDate',         formData.issueDate);
  sv('clientName',        formData.clientName);
  sv('orderCompanyName',  formData.orderCompanyName);
  sv('businessContent',   formData.businessContent);
  sv('workLocation',      formData.workLocation);
  sv('startDate',         formData.startDate);
  sv('endDate',           formData.endDate);
  sv('startTime',         formData.startTime);
  sv('endTime',           formData.endTime);
  sv('breakTime',         formData.breakTime);
  sv('weeklyDays',        formData.weeklyDays);
  sv('contractType',      formData.contractType);
  sv('paymentType',       formData.paymentType);
  sv('paymentSite',       formData.paymentSite);
  sv('settlementType',    formData.settlementType);
  sv('baseHoursOverride', formData.baseHoursOverride || '');
  sv('deductionRange',    formData.deductionRange);
  sv('excessRange',       formData.excessRange);
  sv('timeUnit',          formData.timeUnit);
  sv('timeInterval',      formData.timeInterval);
  sv('roundingType',      formData.roundingType);
  sv('autoRenewal',       formData.autoRenewal);
  sv('autoRenewalPeriod', formData.autoRenewalPeriod);
  sb('travelIncluded',    formData.travelIncluded);
  sv('travelNote',        formData.travelNote);
  sv('businessTripNote',  formData.businessTripNote);
  sb('isBP',              formData.isBP);
  sb('isReceipt',         formData.isReceipt);
  sb('isMultiWorker',     formData.isMultiWorker);
  sb('isDailyCalc',       formData.isDailyCalc);
  sv('dailyStartDate',    formData.dailyStartDate);
  sv('dailyEndDate',      formData.dailyEndDate);
  sv('dailyWorkDays',     formData.dailyWorkDays);
  sv('managementNo',      formData.managementNo);

  for (let i = 0; i < 5; i++) {
    const w = formData.workers[i] || {};
    sv(`w${i}_name`,  w.name);
    sv(`w${i}_kana`,  w.nameKana);
    sv(`w${i}_days`,  w.weeklyDays || formData.weeklyDays);
    sv(`w${i}_price`, w.unitPrice || '');
  }

  sv('s_companyName', settings.companyName);
  sv('s_address',     settings.address);
  sv('s_tel',         settings.tel);
  sv('s_sbUrl',       settings.sbUrl);
  sv('s_sbKey',       settings.sbKey);

  updateConditionalUI();
}

// =====================================================================
// 条件付きUI
// =====================================================================
function toggleVisible(id, show) {
  const e = document.getElementById(id);
  if (e) e.style.display = show ? '' : 'none';
}

function updateConditionalUI() {
  const hasSettle = !['固定','時給'].includes(formData.settlementType);
  toggleVisible('settlementRangeRow',    hasSettle);
  toggleVisible('settlementMethodRow',   hasSettle);
  toggleVisible('baseHoursOverrideRow',  hasSettle);
  toggleVisible('multiWorkerSection',    formData.isMultiWorker);
  toggleVisible('dailySection',          formData.isDailyCalc);
  toggleVisible('autoRenewalPeriodRow',  formData.autoRenewal === '有');
  updateSecondDocTab();
  updateBaseHoursPreview();
  updateCurrentRecordBadge();
}

function updateSecondDocTab() {
  let label = formData.isBP ? '発注書' : (formData.isReceipt ? '請書' : '注文書');
  const tab   = document.getElementById('tab-doc2-btn');
  const title = document.getElementById('doc2-preview-title');
  const btn2  = document.getElementById('btn-doc2');
  if (tab)   tab.textContent   = label;
  if (title) title.textContent = label + ' プレビュー';
  if (btn2)  btn2.textContent  = label + 'を確認';
}

function updateBaseHoursPreview() {
  const el = document.getElementById('baseHoursPreview');
  if (!el) return;
  const ov = formData.baseHoursOverride;
  if (ov > 0) {
    el.textContent = `基本時間: ${ov}h（手動設定）`;
  } else {
    const r = calculateAll(formData);
    el.textContent = r.baseHours ? `基本時間（自動）: ${r.baseHours}h` : '基本時間: 自動計算';
  }
}

function updateCurrentRecordBadge() {
  const el = document.getElementById('currentRecordBadge');
  if (!el) return;
  if (currentRecordId) {
    el.textContent = `📂 ${currentRecordTitle || '読込済み'}`;
    el.style.display = '';
  } else {
    el.style.display = 'none';
  }
}

// =====================================================================
// タブ切替
// =====================================================================
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p =>
    p.classList.toggle('active', p.id === `panel-${name}`));

  if (name === 'mitsumori' || name === 'doc2') {
    // 編集モードを解除してから再描画
    const btn = document.getElementById(`editBtn-${name}`);
    if (btn) { btn.textContent = '✏️ 編集モード'; btn.classList.remove('active'); }
    const dtype = name === 'mitsumori' ? 'mitsumori' : getDoc2Type();
    refreshPreview(dtype, name);
  }
  if (name === 'history') {
    loadHistoryList();
  }
}

function getDoc2Type() {
  if (formData.isBP)      return 'hatchu';
  if (formData.isReceipt) return 'ukesho';
  return 'chumon';
}

function refreshPreview(docType, panelName) {
  readForm();
  const result = calculateAll(formData);
  const html   = renderDoc(docType, result, formData, settings);
  const el     = document.getElementById(`preview-${panelName}`);
  if (el) el.innerHTML = html;
}

// =====================================================================
// 編集モード切替
// =====================================================================
function toggleEdit(panelName) {
  const container = document.getElementById(`preview-${panelName}`);
  const btn       = document.getElementById(`editBtn-${panelName}`);
  const page      = container && container.querySelector('.a4-page');
  if (!page || !btn) return;

  const isEditing = page.getAttribute('contenteditable') === 'true';
  if (isEditing) {
    page.removeAttribute('contenteditable');
    btn.textContent = '✏️ 編集モード';
    btn.classList.remove('active');
  } else {
    page.setAttribute('contenteditable', 'true');
    page.focus();
    btn.textContent = '✅ 編集完了';
    btn.classList.add('active');
  }
}

// =====================================================================
// 印刷
// =====================================================================
function printDoc(panelName) {
  readForm();
  const dtype  = panelName === 'mitsumori' ? 'mitsumori' : getDoc2Type();
  const result = calculateAll(formData);
  const html   = renderDoc(dtype, result, formData, settings);

  // 現在のスタイルシートを取得して埋め込む
  let cssText = '';
  try {
    for (const sheet of document.styleSheets) {
      try {
        for (const r of (sheet.cssRules || sheet.rules)) cssText += r.cssText + '\n';
      } catch(e) {}
    }
  } catch(e) {}

  const TITLES = {mitsumori:'御見積書',hatchu:'御発注書',ukesho:'御請書',chumon:'御注文書'};
  const win = window.open('','_blank','width=900,height=700');
  win.document.write(`<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8">
<title>${TITLES[dtype]||'書類'}</title>
<style>
${cssText}
body{margin:0;padding:0;background:#fff}
.a4-page{box-shadow:none;margin:0;padding:8mm 10mm}
@media print{@page{size:A4 portrait;margin:8mm 10mm}}
</style></head>
<body onload="setTimeout(function(){window.print()},300)">${html}</body></html>`);
  win.document.close();
}

// =====================================================================
// フォームリセット
// =====================================================================
function resetForm() {
  if (!confirm('入力内容をリセットしますか？')) return;
  formData = defaultFormData();
  currentRecordId = null;
  currentRecordTitle = '';
  writeForm();
}

// =====================================================================
// 保存モーダル
// =====================================================================
function openSaveModal() {
  readForm();
  const title = currentRecordTitle ||
    (formData.clientName ? `${formData.clientName} ${formData.startDate || ''}`.trim() : '');
  sv('saveTitle', title);
  document.getElementById('saveModal').style.display = 'flex';
  document.getElementById('saveMsg').textContent = '';
  document.getElementById('saveErr').textContent = '';
  document.getElementById('saveTitle').focus();
}

function closeSaveModal() {
  document.getElementById('saveModal').style.display = 'none';
}

async function executeSave() {
  const title = gv('saveTitle').trim();
  if (!title) { document.getElementById('saveErr').textContent = 'タイトルを入力してください'; return; }
  if (!isSupabaseReady()) {
    document.getElementById('saveErr').textContent = 'Supabase未設定（設定タブで入力）';
    return;
  }

  const btn = document.getElementById('saveBtnExec');
  btn.disabled = true;
  btn.textContent = '保存中...';

  readForm();
  let result;
  if (currentRecordId) {
    result = await dbUpdate(currentRecordId, title, formData);
  } else {
    result = await dbSave(title, formData);
  }

  btn.disabled = false;
  btn.textContent = '保存';

  if (result.error) {
    document.getElementById('saveErr').textContent = 'エラー: ' + result.error;
    return;
  }

  if (!currentRecordId && result.data) {
    currentRecordId = result.data.id;
  }
  currentRecordTitle = title;
  document.getElementById('saveMsg').textContent = '保存しました ✓';
  updateCurrentRecordBadge();
  setTimeout(closeSaveModal, 1000);
}

// =====================================================================
// 履歴パネル
// =====================================================================
async function loadHistoryList() {
  const wrap = document.getElementById('historyList');
  if (!wrap) return;

  if (!isSupabaseReady()) {
    wrap.innerHTML = '<div class="history-empty">Supabase未設定です。設定タブでURL・Keyを入力してください。</div>';
    return;
  }

  wrap.innerHTML = '<div class="history-empty">読み込み中...</div>';
  const { data, error } = await dbLoadList();

  if (error) {
    wrap.innerHTML = `<div class="history-empty">エラー: ${error}</div>`;
    return;
  }
  if (!data.length) {
    wrap.innerHTML = '<div class="history-empty">保存済みのデータがありません</div>';
    return;
  }

  wrap.innerHTML = '<div class="history-list">' +
    data.map(r => {
      const date = new Date(r.updated_at).toLocaleDateString('ja-JP');
      const bp   = r.is_bp ? '<span class="history-card-bp">BP用</span>' : '';
      return `
      <div class="history-card">
        <div class="history-card-info">
          <div class="history-card-title">${escapeHtml(r.title)}${bp}</div>
          <div class="history-card-meta">${escapeHtml(r.client_name || '')}　更新: ${date}</div>
        </div>
        <div class="history-card-actions">
          <button class="btn btn-primary btn-sm" onclick="loadRecord('${r.id}','${escapeHtml(r.title)}')">読込</button>
          <button class="btn btn-danger  btn-sm" onclick="deleteRecord('${r.id}')">削除</button>
        </div>
      </div>`;
    }).join('') +
  '</div>';
}

async function loadRecord(id, title) {
  if (!confirm(`「${title}」を読み込みますか？\n現在の入力内容は上書きされます。`)) return;
  const { data, error } = await dbLoad(id);
  if (error || !data) { alert('読み込みエラー: ' + error); return; }

  formData = Object.assign(defaultFormData(), data.form_data);
  currentRecordId    = id;
  currentRecordTitle = title;
  writeForm();
  switchTab('form');
}

async function deleteRecord(id) {
  if (!confirm('削除しますか？元に戻せません。')) return;
  const { error } = await dbDelete(id);
  if (error) { alert('削除エラー: ' + error); return; }
  if (currentRecordId === id) { currentRecordId = null; currentRecordTitle = ''; updateCurrentRecordBadge(); }
  loadHistoryList();
}

function escapeHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// =====================================================================
// 計算プレビュー（インライン）
// =====================================================================
function updateCalcPreview() {
  const el = document.getElementById('calcPreview0');
  if (!el) return;
  const price = parseInt(document.getElementById('w0_price')?.value) || 0;
  if (!price) { el.textContent = '単価を入力すると計算結果が表示されます'; return; }

  function toH(t){ const [h,m]=(t||'0:0').split(':').map(Number); return h+m/60; }
  const daily  = toH(gv('endTime')) - toH(gv('startTime')) - toH(gv('breakTime'));
  const wdays  = parseInt(gv('weeklyDays')) || 5;
  const ov     = parseInt(gv('baseHoursOverride')) || 0;
  const bh     = ov > 0 ? ov : (wdays * daily * 4);
  const decl   = parseInt(gv('deductionRange')) || 0;
  const excl   = parseInt(gv('excessRange'))    || 0;
  const stype  = gv('settlementType');
  const rtype  = gv('roundingType');

  let msg = '';
  if (!['固定','時給'].includes(stype)) {
    const raw  = price / bh;
    const rate = rtype === '切上げ' ? Math.ceil(raw/10)*10 : Math.floor(raw/10)*10;
    msg = `基本時間: ${bh}h　精算幅: ${bh-decl}h〜${bh+excl}h　時給: ${rate.toLocaleString()}円`;
  } else if (stype === '時給') {
    msg = `時給: ${price.toLocaleString()}円`;
  } else {
    msg = `固定: ${price.toLocaleString()}円/月`;
  }

  const sd = gv('startDate'), ed = gv('endDate');
  if (sd && ed) {
    const months = (new Date(ed+'T00:00:00').getFullYear()-new Date(sd+'T00:00:00').getFullYear())*12
                 + (new Date(ed+'T00:00:00').getMonth()-new Date(sd+'T00:00:00').getMonth())+1;
    if (months > 0) {
      const total = price * months;
      msg += `　→ ${months}ヶ月　合計: ${total.toLocaleString()}円（税込: ${Math.floor(total*1.1).toLocaleString()}円）`;
    }
  }
  el.textContent = msg;
}

// =====================================================================
// Supabase設定適用
// =====================================================================
function applySupabaseSettings() {
  const url = gv('s_sbUrl').trim();
  const key = gv('s_sbKey').trim();
  if (!url || !key) {
    alert('URLとAnon Keyを両方入力してください');
    return;
  }
  const ok = initSupabase(url, key);
  const el = document.getElementById('sbStatus');
  if (ok) {
    if (el) { el.textContent = '✓ 接続設定を適用しました'; el.style.color = '#059669'; }
    settings.sbUrl = url;
    settings.sbKey = key;
    saveToStorage();
  } else {
    if (el) { el.textContent = '✗ 設定に失敗しました（URLまたはKeyを確認）'; el.style.color = '#dc2626'; }
  }
}

// =====================================================================
// 初期化
// =====================================================================
function init() {
  loadFromStorage();
  writeForm();

  // Supabase初期化（設定があれば）
  if (settings.sbUrl && settings.sbKey) {
    initSupabase(settings.sbUrl, settings.sbKey);
  }

  // フォーム変更
  document.getElementById('formMain').addEventListener('input', () => {
    readForm(); updateConditionalUI(); updateCalcPreview(); saveToStorage();
  });
  document.getElementById('formMain').addEventListener('change', () => {
    readForm(); updateConditionalUI(); updateCalcPreview(); saveToStorage();
  });

  // 設定変更
  document.getElementById('formSettings').addEventListener('input', () => {
    readForm(); saveToStorage();
  });

  // タブ
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // 保存モーダル Enterキー
  document.addEventListener('keydown', e => {
    const modal = document.getElementById('saveModal');
    if (modal && modal.style.display !== 'none' && e.key === 'Enter') executeSave();
    if (modal && modal.style.display !== 'none' && e.key === 'Escape') closeSaveModal();
  });

  updateCalcPreview();
}

document.addEventListener('DOMContentLoaded', init);
