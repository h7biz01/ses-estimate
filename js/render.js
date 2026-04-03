'use strict';

// =====================================================================
// ヘルパー
// =====================================================================
function fmtCurrency(n) {
  if (n === null || n === undefined || n === '') return '';
  return Number(n).toLocaleString('ja-JP');
}
function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}
function fmtTime(t) { return t || ''; }
function esc(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function nl2br(s) { return esc(s).replace(/\n/g,'<br>'); }

// =====================================================================
// 書類タイプ別設定
// =====================================================================
function getDocConfig(docType, formData) {
  switch (docType) {
    case 'mitsumori': return {
      title: '御　見　積　書',
      bodyText: '本書に基づき、下記業務の御見積り申し上げます。',
      recipient: formData.clientName || '',
    };
    case 'hatchu': return {
      title: '御　発　注　書',
      bodyText: '下記の通り発注いたしますので、よろしくお願い致します。',
      recipient: formData.orderCompanyName || '',
    };
    case 'ukesho': return {
      title: '御　請　書',
      bodyText: '下記の通り注文をお請け致します。',
      recipient: formData.clientName || '',
    };
    default: return {
      title: '御　注　文　書',
      bodyText: '下記の通り注文いたしますので、よろしくお願い致します。',
      recipient: formData.orderCompanyName || '',
    };
  }
}

// =====================================================================
// 特記事項
// =====================================================================
function buildSpecialNotes(formData) {
  const { settlementType, roundingType, isBP, autoRenewal, autoRenewalPeriod } = formData;
  const hasSettlement = !['固定','時給'].includes(settlementType);
  const includeVirus  = !isBP;
  let s = '　・月単価は基本作業時間内の場合です。\n';
  if (hasSettlement) s += `　・過不足がある場合は上記精算方法にて算出します。その際、単金は${roundingType}計算いたします。\n`;
  s += '　・土日祝日、その他就業先規定による。\n';
  if (includeVirus) {
    s += '\n　・技術者が使用する機器等のウイルス対策（個人情報及び機密情報のコピーや流出並びに\n' +
         '　　不正なプログラムのインストール等が起こらないよう、アクセス権限の設定やパスワードの設定などの\n' +
         '　　適切な整備）は、委託者の責任において行うものとする。\n';
  }
  s += '\n　・業務期間内に作業従事者に起因（勤怠不良・素行不良）する事由により、\n' +
       '　　委託作業の継続が困難な場合は協議の上当該月の請求額を決定する。\n' +
       '　　※その際、交代要員を選任する必要がある場合は協議の上善処する。\n' +
       '　・原則として少なくとも契約終了の一か月前までに契約期間の延長を表明し、\n' +
       '　　双方にとって不都合の無いように協議し善処する。';
  if (autoRenewal === '有') {
    const p = autoRenewalPeriod || '○○';
    s += `\n\n　・本契約は下記契約期間以降${p}ごとの自動更新とする。\n` +
         `　　契約を終了する場合は、少なくとも契約終了の1ヶ月前までに契約解除の意思表示を行うものとする。`;
  }
  return s;
}

function buildDeliverable(formData) {
  return formData.isBP
    ? '細部注文指図・協議によるもの及び作業報告書\n　※各種報告書の提出期日は毎月第1営業日18時までとします'
    : '細部注文指図・協議によるもの及び作業報告書';
}

function buildPaymentText(formData) {
  if (formData.paymentSite == 30) return '月末締め翌月末日払い';
  if (formData.paymentSite)       return `月末締め翌${formData.paymentSite}日払い`;
  return '月末締め翌月末日払い';
}

// =====================================================================
// メイン描画
// =====================================================================
function renderDoc(docType, calcResult, formData, settings) {
  const cfg        = getDocConfig(docType, formData);
  const isFixed    = formData.settlementType === '固定';
  const isHourly   = formData.settlementType === '時給';
  const hasSettle  = !isFixed && !isHourly;
  const issueDate  = fmtDate(formData.issueDate);
  const notes      = buildSpecialNotes(formData);
  const deliverable= buildDeliverable(formData);
  const payText    = buildPaymentText(formData);
  const travel     = formData.travelIncluded ? '☑ 込み　□ 実費' : '□ 込み　☑ 実費';
  const addr       = nl2br(settings.address || '');
  const tel        = esc(settings.tel || '');
  const company    = esc(settings.companyName || '');

  // 精算行
  let settlRows = '';
  if (hasSettle) {
    const tu = formData.timeUnit ? `${formData.timeUnit}分（区切り：${formData.timeInterval || '日ごと'}）` : '';
    settlRows = `
      <tr>
        <td class="di-lbl" rowspan="2">精　算</td>
        <td class="di-sub">基本時間</td>
        <td><strong>${calcResult.baseHours ?? ''}時間</strong></td>
        <td class="di-sub">精算幅</td>
        <td><strong>${calcResult.lowerLimit ?? ''}時間 ～ ${calcResult.upperLimit ?? ''}時間</strong></td>
      </tr>
      <tr>
        <td class="di-sub">精算方法</td>
        <td>${esc(formData.settlementType)}</td>
        <td class="di-sub">時間単位</td>
        <td>${esc(tu)}</td>
      </tr>`;
  } else if (isFixed) {
    settlRows = `<tr><td class="di-lbl">精　算</td><td colspan="4">固定（精算なし）</td></tr>`;
  } else {
    settlRows = `<tr><td class="di-lbl">精　算</td><td colspan="4">時給精算</td></tr>`;
  }

  // 作業者行（未入力はスキップ）
  const WORKER_LABELS = ['作業技術者','作業技術者②','作業技術者③','作業技術者④','作業技術者⑤'];
  let workerRows = '';
  formData.workers.forEach((w, i) => {
    if (!w.name && !w.nameKana) return;
    workerRows += `
      <tr>
        <td class="di-lbl">${WORKER_LABELS[i]}</td>
        <td colspan="2">${esc(w.name)}</td>
        <td class="di-sub">フリガナ</td>
        <td>${esc(w.nameKana)}</td>
      </tr>`;
  });

  // 月単価行（未入力はスキップ）
  const PRICE_LABELS = ['月　単　価','月単価②','月単価③','月単価④','月単価⑤'];
  let priceRows = '';
  calcResult.workers.forEach((w, i) => {
    if (!w.unitPrice) return;
    const weekly   = w.weeklyDays || formData.weeklyDays || '';
    const excess   = w.excessRate    ? fmtCurrency(w.excessRate) + '円'    : '―';
    const deduct   = w.deductionRate ? fmtCurrency(w.deductionRate) + '円' : '―';
    priceRows += `
      <tr>
        <td class="di-lbl">${PRICE_LABELS[i]}</td>
        <td><strong>${fmtCurrency(w.unitPrice)}円</strong>　稼働${weekly}日</td>
        <td class="di-sub">超過単価</td>
        <td>${isHourly||isFixed ? '―' : excess}</td>
        <td class="di-sub"style="padding-left:6px">控除単価　${isHourly||isFixed ? '―' : deduct}</td>
      </tr>`;
  });

  // 時間単価行
  let hourlyRow = '';
  const w0 = calcResult.workers[0];
  if (w0 && w0.hourlyRate && !isFixed) {
    const tu = formData.timeUnit ? `${formData.timeUnit}分（区切り：${formData.timeInterval || '日ごと'}）` : '';
    hourlyRow = `
      <tr>
        <td class="di-lbl">時間単価</td>
        <td><strong>${fmtCurrency(w0.hourlyRate)}円</strong></td>
        <td class="di-sub">基本時間</td>
        <td>${calcResult.baseHours ?? ''}時間</td>
        <td class="di-sub" style="padding-left:6px">時間単位　${esc(tu)}</td>
      </tr>`;
  }

  // 初月日割行
  let dailyRow = '';
  if (formData.isDailyCalc && calcResult.dailyProration) {
    const dp = calcResult.dailyProration;
    dailyRow = `
      <tr>
        <td class="di-lbl" rowspan="2">初月日割</td>
        <td class="di-sub">営業日</td>
        <td>${dp.businessDays}日</td>
        <td class="di-sub">稼働予定日</td>
        <td>${dp.workDays}日</td>
      </tr>
      <tr>
        <td colspan="4" style="font-size:8pt">
          月額 ${fmtCurrency(dp.unitPrice)}円 ÷ ${dp.businessDays}日（営業日）× ${dp.workDays}日（稼働予定日）＝ <strong>${fmtCurrency(dp.amount)}円</strong>
        </td>
      </tr>`;
  }

  // 詳細行（入力があるもののみ）
  const NUMS = ['①','②','③','④','⑤'];
  let detailRows = '';
  calcResult.workers.forEach((w, i) => {
    detailRows += `
      <tr>
        <td class="text-c">${NUMS[i]}</td>
        <td>${esc(w.name)}</td>
        <td class="text-c">${fmtDate(formData.startDate)}</td>
        <td class="text-c">～</td>
        <td class="text-c">${fmtDate(formData.endDate)}</td>
        <td class="text-r">${fmtCurrency(w.unitPrice)}円</td>
        <td class="text-c">${w.months}</td>
        <td class="text-r">${fmtCurrency(w.totalPrice)}円</td>
      </tr>`;
  });
  // 入力なし行（残り空行）
  for (let i = calcResult.workers.length; i < 5; i++) {
    detailRows += `
      <tr>
        <td class="text-c">${NUMS[i]}</td>
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>`;
  }

  const mgmtNo = formData.managementNo
    ? `<div class="doc-mgmt">管理番号：${esc(formData.managementNo)}</div>` : '';

  return `
<div class="document a4-page" id="doc-${docType}">

  <!-- ヘッダー -->
  <div class="doc-header">
    <div class="doc-title">${cfg.title}</div>
    <div class="doc-date">発行日　${issueDate}</div>
  </div>

  <!-- 宛先 + 会社情報 -->
  <div class="doc-top">
    <div class="doc-top-left">
      <div class="doc-recipient">${esc(cfg.recipient)}&nbsp;御中</div>
      <div class="doc-message">${esc(cfg.bodyText)}</div>
    </div>
    <div class="doc-top-right">
      <table class="doc-company-tbl">
        <tr><td class="dc-lbl">住　所</td><td>${addr}${tel ? '<br>TEL　' + tel : ''}</td></tr>
        <tr><td class="dc-lbl">会社名</td>
            <td class="dc-name">${company}<img src="assets/seal.png" class="seal-img" alt="印"></td></tr>
      </table>
    </div>
  </div>

  <div class="doc-hr"></div>

  <!-- 業務情報テーブル -->
  <table class="doc-info-tbl">
    <colgroup>
      <col style="width:13%">
      <col style="width:22%">
      <col style="width:18%">
      <col style="width:22%">
      <col style="width:25%">
    </colgroup>
    <tr>
      <td class="di-lbl">業　務</td>
      <td colspan="4">　${esc(formData.businessContent || '')}</td>
    </tr>
    <tr>
      <td class="di-lbl">作業期間</td>
      <td colspan="4">下記詳細に記載</td>
    </tr>
    <tr>
      <td class="di-lbl">作業時間</td>
      <td>開始　${fmtTime(formData.startTime)}</td>
      <td></td>
      <td>終了　${fmtTime(formData.endTime)}</td>
      <td></td>
    </tr>
    <tr>
      <td class="di-lbl">作業場所</td>
      <td colspan="4">　${esc(formData.workLocation || '')}</td>
    </tr>
    <tr>
      <td class="di-lbl">成果物</td>
      <td colspan="4">${nl2br(deliverable)}</td>
    </tr>
    <tr>
      <td class="di-lbl" rowspan="3">貸与物等</td>
      <td colspan="4">上記業務に必要なもの</td>
    </tr>
    <tr><td colspan="4">　貸与期間は作業期間と同一とします。</td></tr>
    <tr><td colspan="4">　作業期間の延長が行われた場合は、貸与期間も同様に延長するものとします。</td></tr>
    <tr>
      <td class="di-lbl">支払方法</td>
      <td colspan="4">　${payText}</td>
    </tr>
    <tr>
      <td class="di-lbl" rowspan="3">その他条件</td>
      <td class="di-sub">交通費</td>
      <td>${travel}</td>
      <td class="di-sub">備考</td>
      <td>${esc(formData.travelNote || '')}</td>
    </tr>
    <tr>
      <td class="di-sub">出張交通費</td>
      <td>□ 込み　☑ 実費</td>
      <td class="di-sub">備考</td>
      <td>${esc(formData.businessTripNote || '')}</td>
    </tr>
    <tr>
      <td class="di-sub">宿泊費</td>
      <td>□ 込み　☑ 実費</td>
      <td class="di-sub">備考</td>
      <td></td>
    </tr>
    ${settlRows}
    ${workerRows}
    ${priceRows}
    ${dailyRow}
    ${hourlyRow}
  </table>

  <!-- 特記事項 -->
  <table class="doc-notes-tbl">
    <tr>
      <td class="di-lbl" style="width:13%;vertical-align:top;padding-top:5px">特記事項</td>
      <td class="doc-notes-body">${nl2br(notes)}</td>
    </tr>
  </table>

  <!-- 詳細 -->
  <div class="doc-detail-hdr">【詳　細】</div>
  <table class="doc-detail-tbl">
    <thead>
      <tr>
        <th style="width:4%"></th>
        <th style="width:14%">技術者氏名</th>
        <th style="width:13%" class="text-c">作業開始</th>
        <th style="width:3%"  class="text-c"></th>
        <th style="width:13%" class="text-c">作業終了</th>
        <th style="width:16%" class="text-r">単価</th>
        <th style="width:11%" class="text-c">期間（ヶ月）</th>
        <th style="width:26%" class="text-r">合計金額</th>
      </tr>
    </thead>
    <tbody>
      ${detailRows}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="6"></td>
        <td class="text-c total-lbl">合　計</td>
        <td class="text-r total-val">${fmtCurrency(calcResult.totalAmount)}円</td>
      </tr>
      <tr>
        <td colspan="6"></td>
        <td class="text-c total-lbl">（税込）</td>
        <td class="text-r total-val">${fmtCurrency(calcResult.includingTax)}円</td>
      </tr>
    </tfoot>
  </table>

  ${mgmtNo}
</div>`;
}
