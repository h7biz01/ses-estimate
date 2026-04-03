'use strict';

// =====================================================================
// デフォルト値
// =====================================================================
function defaultFormData() {
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth()+1).padStart(2,'0');
  const dd    = String(today.getDate()).padStart(2,'0');
  return {
    issueDate:        `${yyyy}-${mm}-${dd}`,
    clientName:       '',
    businessContent:  '業務支援及びそれに付随する業務',
    workLocation:     '貴社指定場所',
    startDate:        '',
    endDate:          '',
    startTime:        '10:00',
    endTime:          '19:00',
    breakTime:        '01:00',
    weeklyDays:       5,
    contractType:     '業務委託',
    paymentType:      '月給',
    paymentSite:      30,
    settlementType:   '中央割',
    baseHoursOverride: 0,   // 0 = 自動計算
    deductionRange:   20,
    excessRange:      20,
    timeUnit:         15,
    timeInterval:     '日ごと',
    roundingType:     '切捨て',
    autoRenewal:      '無',
    autoRenewalPeriod:'',
    travelIncluded:   true,
    travelNote:       '',
    businessTripNote: '',
    isBP:             false,
    isReceipt:        false,
    isMultiWorker:    false,
    isDailyCalc:      false,
    dailyStartDate:   '',
    dailyEndDate:     '',
    dailyWorkDays:    '',
    managementNo:     '',
    orderCompanyName: '',
    workers: [
      { name:'', nameKana:'', weeklyDays:5, unitPrice:0 },
      { name:'', nameKana:'', weeklyDays:5, unitPrice:0 },
      { name:'', nameKana:'', weeklyDays:5, unitPrice:0 },
      { name:'', nameKana:'', weeklyDays:5, unitPrice:0 },
      { name:'', nameKana:'', weeklyDays:5, unitPrice:0 },
    ],
  };
}

function defaultSettings() {
  return {
    companyName: '株式会社ワンゴジュウゴ',
    address:     '〒102-0094\n東京都千代田区紀尾井町3-6\n紀尾井町パークビル7F',
    tel:         '03-3234-5576',
  };
}

// =====================================================================
// 状態
// =====================================================================
let formData = defaultFormData();
let settings = defaultSettings();
let currentPreviewType = 'mitsumori';

// =====================================================================
// ストレージ
// =====================================================================
function saveToStorage() {
  try {
    localStorage.setItem('ses_form', JSON.stringify(formData));
    localStorage.setItem('ses_settings', JSON.stringify(settings));
  } catch(e) { /* ignore */ }
}

function loadFromStorage() {
  try {
    const f = localStorage.getItem('ses_form');
    const s = localStorage.getItem('ses_settings');
    if (f) formData = Object.assign(defaultFormData(), JSON.parse(f));
    if (s) settings = Object.assign(defaultSettings(), JSON.parse(s));
  } catch(e) { /* ignore */ }
}

// =====================================================================
// フォーム ↔ 状態 同期
// =====================================================================
function readForm() {
  const g = id => document.getElementById(id);
  const gv = id => { const el=g(id); return el ? el.value : ''; };
  const gb = id => { const el=g(id); return el ? el.checked : false; };

  formData.issueDate       = gv('issueDate');
  formData.clientName      = gv('clientName');
  formData.orderCompanyName= gv('orderCompanyName');
  formData.businessContent = gv('businessContent');
  formData.workLocation    = gv('workLocation');
  formData.startDate       = gv('startDate');
  formData.endDate         = gv('endDate');
  formData.startTime       = gv('startTime');
  formData.endTime         = gv('endTime');
  formData.breakTime       = gv('breakTime');
  formData.weeklyDays      = parseInt(gv('weeklyDays')) || 5;
  formData.contractType    = gv('contractType');
  formData.paymentType     = gv('paymentType');
  formData.paymentSite     = parseInt(gv('paymentSite')) || 30;
  formData.settlementType  = gv('settlementType');
  formData.baseHoursOverride = parseInt(gv('baseHoursOverride')) || 0;
  formData.deductionRange  = parseInt(gv('deductionRange')) || 0;
  formData.excessRange     = parseInt(gv('excessRange')) || 0;
  formData.timeUnit        = parseInt(gv('timeUnit')) || 15;
  formData.timeInterval    = gv('timeInterval');
  formData.roundingType    = gv('roundingType');
  formData.autoRenewal     = gv('autoRenewal');
  formData.autoRenewalPeriod = gv('autoRenewalPeriod');
  formData.travelIncluded  = gb('travelIncluded');
  formData.travelNote      = gv('travelNote');
  formData.businessTripNote= gv('businessTripNote');
  formData.isBP            = gb('isBP');
  formData.isReceipt       = gb('isReceipt');
  formData.isMultiWorker   = gb('isMultiWorker');
  formData.isDailyCalc     = gb('isDailyCalc');
  formData.dailyStartDate  = gv('dailyStartDate');
  formData.dailyEndDate    = gv('dailyEndDate');
  formData.dailyWorkDays   = gv('dailyWorkDays');
  formData.managementNo    = gv('managementNo');

  // 作業者
  for (let i = 0; i < 5; i++) {
    formData.workers[i].name      = gv(`w${i}_name`);
    formData.workers[i].nameKana  = gv(`w${i}_kana`);
    formData.workers[i].weeklyDays= parseInt(gv(`w${i}_days`)) || formData.weeklyDays;
    formData.workers[i].unitPrice = parseInt(gv(`w${i}_price`)) || 0;
  }

  // 設定
  settings.companyName = gv('s_companyName');
  settings.address     = gv('s_address');
  settings.tel         = gv('s_tel');
}

function writeForm() {
  const sv = (id, val) => { const el=document.getElementById(id); if(el) el.value = val ?? ''; };
  const sb = (id, val) => { const el=document.getElementById(id); if(el) el.checked = !!val; };

  sv('issueDate',        formData.issueDate);
  sv('clientName',       formData.clientName);
  sv('orderCompanyName', formData.orderCompanyName);
  sv('businessContent',  formData.businessContent);
  sv('workLocation',     formData.workLocation);
  sv('startDate',        formData.startDate);
  sv('endDate',          formData.endDate);
  sv('startTime',        formData.startTime);
  sv('endTime',          formData.endTime);
  sv('breakTime',        formData.breakTime);
  sv('weeklyDays',       formData.weeklyDays);
  sv('contractType',     formData.contractType);
  sv('paymentType',      formData.paymentType);
  sv('paymentSite',      formData.paymentSite);
  sv('settlementType',   formData.settlementType);
  sv('baseHoursOverride',formData.baseHoursOverride || '');
  sv('deductionRange',   formData.deductionRange);
  sv('excessRange',      formData.excessRange);
  sv('timeUnit',         formData.timeUnit);
  sv('timeInterval',     formData.timeInterval);
  sv('roundingType',     formData.roundingType);
  sv('autoRenewal',      formData.autoRenewal);
  sv('autoRenewalPeriod',formData.autoRenewalPeriod);
  sb('travelIncluded',   formData.travelIncluded);
  sv('travelNote',       formData.travelNote);
  sv('businessTripNote', formData.businessTripNote);
  sb('isBP',             formData.isBP);
  sb('isReceipt',        formData.isReceipt);
  sb('isMultiWorker',    formData.isMultiWorker);
  sb('isDailyCalc',      formData.isDailyCalc);
  sv('dailyStartDate',   formData.dailyStartDate);
  sv('dailyEndDate',     formData.dailyEndDate);
  sv('dailyWorkDays',    formData.dailyWorkDays);
  sv('managementNo',     formData.managementNo);

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

  updateConditionalUI();
}

// =====================================================================
// 条件付きUI更新
// =====================================================================
function updateConditionalUI() {
  // 精算方法によって幅入力を表示/非表示
  const hasSettle = !['固定','時給'].includes(formData.settlementType);
  toggleVisible('settlementRangeRow', hasSettle);
  toggleVisible('settlementMethodRow', hasSettle);
  toggleVisible('baseHoursOverrideRow', hasSettle);

  // 追加要員
  const multi = formData.isMultiWorker;
  toggleVisible('multiWorkerSection', multi);

  // 日割
  const daily = formData.isDailyCalc;
  toggleVisible('dailySection', daily);

  // 自動更新期間
  toggleVisible('autoRenewalPeriodRow', formData.autoRenewal === '有');

  // 第2書類タブ名更新
  updateSecondDocTab();

  // 基本時間（自動計算表示）
  updateBaseHoursPreview();
}

function toggleVisible(id, show) {
  const el = document.getElementById(id);
  if (el) el.style.display = show ? '' : 'none';
}

function updateSecondDocTab() {
  const tab = document.getElementById('tab-doc2-btn');
  const title = document.getElementById('doc2-preview-title');
  const btn2  = document.getElementById('btn-doc2');
  let label;
  if (formData.isBP)           label = '発注書';
  else if (formData.isReceipt) label = '請書';
  else                         label = '注文書';
  if (tab)   tab.textContent = label;
  if (title) title.textContent = label + ' プレビュー';
  if (btn2)  btn2.textContent = label + 'を確認';
}

function updateBaseHoursPreview() {
  const el = document.getElementById('baseHoursPreview');
  if (!el) return;
  const override = formData.baseHoursOverride;
  if (override > 0) {
    el.textContent = `基本時間: ${override}h（手動設定）`;
  } else {
    const result = calculateAll(formData);
    el.textContent = result.baseHours
      ? `基本時間（自動）: ${result.baseHours}h`
      : '基本時間: 自動計算';
  }
}

// =====================================================================
// タブ切替
// =====================================================================
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${name}`));

  if (name === 'mitsumori' || name === 'doc2') {
    const docType = name === 'mitsumori' ? 'mitsumori' : getDoc2Type();
    refreshPreview(docType, name);
  }
}

function getDoc2Type() {
  if (formData.isBP)      return 'hatchu';
  if (formData.isReceipt) return 'ukesho';
  return 'chumon';
}

function refreshPreview(docType, panelName) {
  readForm();
  const calcResult = calculateAll(formData);
  const html = renderDoc(docType, calcResult, formData, settings);
  const container = document.getElementById(`preview-${panelName}`);
  if (container) container.innerHTML = html;
}

// =====================================================================
// 印刷
// =====================================================================
function printDoc(panelName) {
  readForm();
  const docType = panelName === 'mitsumori' ? 'mitsumori' : getDoc2Type();
  const calcResult = calculateAll(formData);
  const html = renderDoc(docType, calcResult, formData, settings);

  // スタイルシートを本ページから取得して埋め込む（新窓でも確実に適用）
  const cssLink = document.querySelector('link[rel="stylesheet"]');
  let cssText = '';
  try {
    const sheets = document.styleSheets;
    for (const sheet of sheets) {
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (const rule of rules) cssText += rule.cssText + '\n';
      } catch(e) { /* cross-origin skip */ }
    }
  } catch(e) { /* ignore */ }

  const titles = { mitsumori:'御見積書', hatchu:'御発注書', ukesho:'御請書', chumon:'御注文書' };
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>${titles[docType] || '書類'}</title>
<style>
${cssText}
body { margin: 0; padding: 0; background: #fff; }
.a4-page { box-shadow: none; margin: 0; padding: 8mm 10mm; }
@media print { @page { size: A4 portrait; margin: 8mm 10mm; } }
</style>
</head>
<body onload="setTimeout(function(){window.print();},300)">
${html}
</body>
</html>`);
  win.document.close();
}

// =====================================================================
// リセット・保存
// =====================================================================
function resetForm() {
  if (!confirm('入力内容をリセットしますか？')) return;
  formData = defaultFormData();
  writeForm();
  updateConditionalUI();
}

// =====================================================================
// 初期化
// =====================================================================
function init() {
  loadFromStorage();
  writeForm();
  updateConditionalUI();

  // フォーム変更時: 自動計算更新 + 保存
  document.getElementById('formMain').addEventListener('input', () => {
    readForm();
    updateConditionalUI();
    saveToStorage();
  });
  document.getElementById('formMain').addEventListener('change', () => {
    readForm();
    updateConditionalUI();
    saveToStorage();
  });

  // 設定変更時: 保存
  document.getElementById('formSettings').addEventListener('input', () => {
    readForm();
    saveToStorage();
  });

  // タブボタン
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

document.addEventListener('DOMContentLoaded', init);
