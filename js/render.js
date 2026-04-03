'use strict';

// =====================================================================
// フォーマットヘルパー
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

function fmtTime(timeStr) {
  if (!timeStr) return '';
  return timeStr;
}

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nl2br(str) {
  return escHtml(str).replace(/\n/g, '<br>');
}

// =====================================================================
// 書類タイプ別テキスト
// =====================================================================
function getDocConfig(docType, formData) {
  switch (docType) {
    case 'mitsumori':
      return {
        title:     '御　見　積　書',
        bodyText:  '本書に基づき、下記業務の御見積り申し上げます。',
        recipient: formData.clientName || '',
        honorific: '御中',
        fromLabel: '見積書発行元',
      };
    case 'hatchu':
      return {
        title:     '御　発　注　書',
        bodyText:  '下記の通り発注いたしますので、よろしくお願い致します。',
        recipient: formData.orderCompanyName || formData.clientName || '',
        honorific: '御中',
        fromLabel: '発注元',
      };
    case 'ukesho':
      return {
        title:     '御　請　書',
        bodyText:  '下記の通り注文をお請け致します。',
        recipient: formData.clientName || '',
        honorific: '御中',
        fromLabel: '受注元',
      };
    default: // chumon
      return {
        title:     '御　注　文　書',
        bodyText:  '下記の通り注文いたしますので、よろしくお願い致します。',
        recipient: formData.orderCompanyName || '',
        honorific: '御中',
        fromLabel: '注文元',
      };
  }
}

// =====================================================================
// 特記事項テキスト生成
// =====================================================================
function buildSpecialNotes(formData) {
  const { settlementType, roundingType, isBP, autoRenewal, autoRenewalPeriod } = formData;
  const hasSettlement = settlementType !== '固定' && settlementType !== '時給';
  const includeVirus = !isBP; // BP用はウイルス対策文言省略

  let notes = '　・月単価は基本作業時間内の場合です。\n';

  if (hasSettlement) {
    notes += `　・過不足がある場合は上記精算方法にて算出します。その際、単金は${roundingType}計算いたします。\n`;
  }
  notes += '　・土日祝日、その他就業先規定による。\n';

  if (includeVirus) {
    notes += '\n　・技術者が使用する機器等のウイルス対策（個人情報及び機密情報のコピーや流出並びに\n' +
             '　　不正なプログラムのインストール等が起こらないよう、アクセス権限の設定やパスワードの設定などの\n' +
             '　　適切な整備）は、委託者の責任において行うものとする。\n';
  }

  notes += '\n　・業務期間内に作業従事者に起因（勤怠不良・素行不良）する事由により、\n' +
           '　　委託作業の継続が困難な場合は協議の上当該月の請求額を決定する。\n' +
           '　　※その際、交代要員を選任する必要がある場合は協議の上善処する。\n' +
           '　・原則として少なくとも契約終了の一か月前までに契約期間の延長を表明し、\n' +
           '　　双方にとって不都合の無いように協議し善処する。';

  if (autoRenewal === '有') {
    const period = autoRenewalPeriod || '○○';
    notes += `\n\n　・本契約は下記契約期間以降${period}ごとの自動更新とする。\n` +
             `　　契約を終了する場合は、少なくとも契約終了の1ヶ月前までに契約解除の意思表示を行うものとする。`;
  }

  return notes;
}

// 成果物表記
function buildDeliverable(formData) {
  if (formData.isBP) {
    return '細部注文指図・協議によるもの及び作業報告書\n　※各種報告書の提出期日は毎月第1営業日18時までとします';
  }
  return '細部注文指図・協議によるもの及び作業報告書';
}

// 支払方法テキスト
function buildPaymentText(formData) {
  if (formData.paymentSite == 30) return '月末締め翌月末日払い';
  if (formData.paymentSite) return `月末締め翌${formData.paymentSite}日払い`;
  return '月末締め翌月末日払い';
}

// =====================================================================
// テーブル行パーツ
// =====================================================================

// 作業技術者 ①〜⑤
function renderWorkerRows(workers) {
  const LABELS = ['作業技術者','作業技術者②','作業技術者③','作業技術者④','作業技術者⑤'];
  return LABELS.map((label, i) => {
    const w = workers[i] || {};
    const name = w.name ? `　${escHtml(w.name)}` : '　';
    const kana = escHtml(w.nameKana || '');
    return `
    <tr>
      <td class="lbl" colspan="2">${label}</td>
      <td colspan="5">${name}</td>
      <td class="lbl-sm" colspan="2">（フリガナ）</td>
      <td colspan="7">${kana}</td>
    </tr>`;
  }).join('');
}

// 月単価 ①〜⑤
function renderUnitPriceRows(calcResult, formData) {
  const LABELS = ['月単価','月単価②','月単価③','月単価④','月単価⑤'];
  const isHourly = formData.settlementType === '時給';

  return LABELS.map((label, i) => {
    const w = calcResult.workers[i];
    const price    = w ? fmtCurrency(w.unitPrice) + '円' : '';
    const weekly   = w ? (w.weeklyDays || '') : '';
    const excess   = (w && w.excessRate)    ? fmtCurrency(w.excessRate) + '円' : '';
    const deduct   = (w && w.deductionRate) ? fmtCurrency(w.deductionRate) + '円' : '';
    const unit = formData.settlementType === '時給' ? '時給' : '月額';

    return `
    <tr>
      <td class="lbl" colspan="2">${label}</td>
      <td colspan="3">${price}</td>
      <td class="lbl-sm">稼働</td>
      <td>${weekly}</td>
      <td class="lbl-sm" colspan="2">超過単価</td>
      <td colspan="2">${isHourly ? '' : excess}</td>
      <td class="lbl-sm" colspan="2">控除単価</td>
      <td colspan="3">${isHourly ? '' : deduct}</td>
    </tr>`;
  }).join('');
}

// 初月精算（日割り）
function renderDailyProration(calcResult, formData) {
  const dp = calcResult.dailyProration;

  if (!formData.isDailyCalc || !dp) {
    return `
    <tr>
      <td class="lbl" colspan="2">初月精算（日割り）</td>
      <td colspan="3" class="lbl-sm">営業日</td>
      <td colspan="3"></td>
      <td colspan="3" class="lbl-sm">稼働予定日</td>
      <td colspan="4"></td>
    </tr>
    <tr>
      <td colspan="2"></td>
      <td colspan="14"></td>
    </tr>`;
  }

  const line = `　　月額：${fmtCurrency(dp.unitPrice)}円÷${dp.businessDays}日（営業日）×${dp.workDays}日（稼働予定日）＝${fmtCurrency(dp.amount)}円`;
  return `
    <tr>
      <td class="lbl" colspan="2">初月精算（日割り）</td>
      <td colspan="3" class="lbl-sm">営業日</td>
      <td colspan="2">${dp.businessDays}</td>
      <td colspan="3" class="lbl-sm">稼働予定日</td>
      <td colspan="5">${dp.workDays}</td>
    </tr>
    <tr>
      <td colspan="2"></td>
      <td colspan="14">${line}</td>
    </tr>`;
}

// 詳細行 ①〜⑤
function renderDetailRows(calcResult, formData) {
  const NUMS = ['①','②','③','④','⑤'];
  return NUMS.map((num, i) => {
    const w = calcResult.workers[i];
    const name  = w ? escHtml(w.name) : '';
    const start = w ? fmtDate(formData.startDate) : '';
    const end   = w ? fmtDate(formData.endDate) : '';
    const price = w && w.unitPrice  ? fmtCurrency(w.unitPrice) + '円'  : '';
    const months= w ? w.months : '';
    const total = w && w.totalPrice ? fmtCurrency(w.totalPrice) + '円' : '';

    return `
    <tr class="detail-data">
      <td class="text-c">${num}</td>
      <td colspan="2">${name}</td>
      <td colspan="3">${start}</td>
      <td class="text-c">～</td>
      <td colspan="3">${end}</td>
      <td colspan="2" class="text-r">${price}</td>
      <td colspan="2" class="text-c">${months}</td>
      <td colspan="2" class="text-r">${total}</td>
    </tr>`;
  }).join('');
}

// =====================================================================
// メイン描画関数
// =====================================================================
function renderDoc(docType, calcResult, formData, settings) {
  const cfg = getDocConfig(docType, formData);
  const { settlementType } = formData;
  const hasSettlement = settlementType !== '固定' && settlementType !== '時給';
  const isFixed = settlementType === '固定';
  const isHourly = settlementType === '時給';

  const issueDate    = fmtDate(formData.issueDate);
  const specialNotes = buildSpecialNotes(formData);
  const deliverable  = buildDeliverable(formData);
  const paymentText  = buildPaymentText(formData);

  // 精算セクション
  let settlSection = '';
  if (hasSettlement) {
    const timeUnitText = formData.timeUnit
      ? `${formData.timeUnit} 分（区切り：${formData.timeInterval || '日ごと'}）`
      : '';
    settlSection = `
    <tr>
      <td class="lbl" rowspan="2" colspan="2">精算</td>
      <td class="lbl-sm">基本</td>
      <td colspan="2">${calcResult.baseHours ?? ''}時間</td>
      <td class="lbl-sm" colspan="2">精算幅</td>
      <td colspan="2">${calcResult.lowerLimit ?? ''}</td>
      <td class="text-c">～</td>
      <td colspan="5">${calcResult.upperLimit ?? ''}</td>
    </tr>
    <tr>
      <td class="lbl-sm">精算方法</td>
      <td colspan="2">${escHtml(settlementType)}</td>
      <td class="lbl-sm" colspan="2">時間単位</td>
      <td colspan="9">${escHtml(timeUnitText)}</td>
    </tr>`;
  } else if (isFixed) {
    settlSection = `
    <tr>
      <td class="lbl" colspan="2">精算</td>
      <td colspan="14">固定（精算なし）</td>
    </tr>`;
  } else if (isHourly) {
    settlSection = `
    <tr>
      <td class="lbl" colspan="2">精算</td>
      <td colspan="14">時給精算</td>
    </tr>`;
  }

  // 時間単価セクション
  let hourlySection = '';
  const w0 = calcResult.workers[0];
  if (w0 && w0.hourlyRate && !isFixed) {
    const tu = formData.timeUnit
      ? `${formData.timeUnit} 分（区切り：${formData.timeInterval || '日ごと'}）`
      : '';
    hourlySection = `
    <tr>
      <td class="lbl" colspan="2">時間単価</td>
      <td colspan="2">${fmtCurrency(w0.hourlyRate)}円</td>
      <td class="lbl-sm" colspan="2">基本時間</td>
      <td colspan="2">${calcResult.baseHours ?? ''}時間</td>
      <td class="lbl-sm" colspan="2">時間単位</td>
      <td colspan="6">${escHtml(tu)}</td>
    </tr>`;
  }

  // 交通費チェック表示
  const travelIncl = formData.travelIncluded
    ? '☑ 込み　□ 実費'
    : '□ 込み　☑ 実費';

  // 管理番号
  const mgmtNo = formData.managementNo
    ? `<tr><td colspan="12"></td><td colspan="4" class="text-r small">管理番号：${escHtml(formData.managementNo)}</td></tr>`
    : '';

  // 会社情報（設定から）
  const addr     = nl2br(settings.address || '');
  const tel      = escHtml(settings.tel || '');
  const company  = escHtml(settings.companyName || '');

  return `
<div class="document a4-page" id="doc-${docType}">
  <table class="doc-table">
    <colgroup>
      ${Array(16).fill(0).map(() => '<col>').join('')}
    </colgroup>

    <!-- 発行日 -->
    <tr>
      <td colspan="9"></td>
      <td class="lbl-sm" colspan="2">発行日</td>
      <td colspan="5" class="issue-date">${issueDate}</td>
    </tr>

    <!-- タイトル -->
    <tr class="title-row">
      <td colspan="16" class="doc-title">${cfg.title}</td>
    </tr>

    <!-- 空白 -->
    <tr class="spacer"><td colspan="16"></td></tr>

    <!-- 宛先 -->
    <tr>
      <td colspan="5" class="recipient">${escHtml(cfg.recipient)}</td>
      <td class="honorific">${cfg.honorific}</td>
      <td colspan="10"></td>
    </tr>

    <!-- 空白 -->
    <tr class="spacer"><td colspan="16"></td></tr>

    <!-- 本文 + 会社情報（右） -->
    <tr>
      <td colspan="8" class="body-text">${escHtml(cfg.bodyText)}</td>
      <td class="lbl-sm right" colspan="2">住　所</td>
      <td colspan="6" class="company-info" rowspan="5">${addr}${tel ? '<br>TEL：' + tel : ''}</td>
    </tr>
    <tr class="mini-spacer"><td colspan="10"></td></tr>
    <tr class="mini-spacer"><td colspan="10"></td></tr>
    <tr>
      <td colspan="8"></td>
      <td class="lbl-sm right" colspan="2">会社名</td>
    </tr>
    <tr>
      <td colspan="8"></td>
      <td colspan="2"></td>
    </tr>
    <tr>
      <td colspan="8"></td>
      <td colspan="2"></td>
      <td colspan="5" class="company-name">${company}</td>
      <td class="seal-box">㊞</td>
    </tr>

    <!-- 区切り -->
    <tr class="divider"><td colspan="16"></td></tr>

    <!-- 業務情報 -->
    <tr>
      <td class="lbl" colspan="2">業　務</td>
      <td colspan="14">　${escHtml(formData.businessContent || '')}</td>
    </tr>
    <tr>
      <td class="lbl" colspan="2">作業期間</td>
      <td colspan="14">下記詳細に記載</td>
    </tr>
    <tr>
      <td class="lbl" colspan="2">作業時間</td>
      <td class="lbl-sm">開始</td>
      <td colspan="3">${fmtTime(formData.startTime)}</td>
      <td colspan="2"></td>
      <td class="lbl-sm" colspan="2">終了</td>
      <td colspan="6">${fmtTime(formData.endTime)}</td>
    </tr>
    <tr>
      <td class="lbl" colspan="2">作業場所</td>
      <td colspan="14">　${escHtml(formData.workLocation || '')}</td>
    </tr>
    <tr>
      <td class="lbl" colspan="2">成果物</td>
      <td colspan="14">${nl2br(deliverable)}</td>
    </tr>
    <tr>
      <td class="lbl" rowspan="3" colspan="2">貸与物等</td>
      <td colspan="14">上記業務に必要なもの</td>
    </tr>
    <tr><td colspan="14">　貸与期間は作業期間と同一とします。</td></tr>
    <tr><td colspan="14">　作業期間の延長が行われた場合は、貸与期間も同様に延長するものとします。</td></tr>
    <tr>
      <td class="lbl" colspan="2">支払方法</td>
      <td colspan="14">　${paymentText}</td>
    </tr>
    <tr>
      <td class="lbl" rowspan="3" colspan="2">その他条件</td>
      <td class="lbl-sm">交通費</td>
      <td colspan="4">${travelIncl}</td>
      <td class="lbl-sm" colspan="2">備考</td>
      <td colspan="7">${escHtml(formData.travelNote || '')}</td>
    </tr>
    <tr>
      <td class="lbl-sm">出張交通費</td>
      <td colspan="4">□ 込み　☑ 実費</td>
      <td class="lbl-sm" colspan="2">備考</td>
      <td colspan="7">${escHtml(formData.businessTripNote || '')}</td>
    </tr>
    <tr>
      <td class="lbl-sm">宿泊費</td>
      <td colspan="4">□ 込み　☑ 実費</td>
      <td class="lbl-sm" colspan="2">備考</td>
      <td colspan="7"></td>
    </tr>

    <!-- 精算 -->
    ${settlSection}

    <!-- 作業技術者 -->
    ${renderWorkerRows(formData.workers)}

    <!-- 月単価 -->
    ${renderUnitPriceRows(calcResult, formData)}

    <!-- 初月精算 -->
    ${renderDailyProration(calcResult, formData)}

    <!-- 時間単価 -->
    ${hourlySection}

    <!-- 特記事項 -->
    <tr>
      <td class="lbl notes-lbl" colspan="2" style="vertical-align:top">特記事項</td>
      <td colspan="14" class="notes">${nl2br(specialNotes)}</td>
    </tr>

    <!-- 詳細ヘッダー -->
    <tr class="section-hdr">
      <td colspan="16">【詳　細】</td>
    </tr>
    <tr class="detail-hdr">
      <td></td>
      <td colspan="2">技術者氏名</td>
      <td colspan="7" class="text-c">作業期間</td>
      <td colspan="2" class="text-c">単価</td>
      <td colspan="2" class="text-c">期間（ヶ月）</td>
      <td colspan="2" class="text-c">合計金額</td>
    </tr>

    ${renderDetailRows(calcResult, formData)}

    <!-- 合計 -->
    <tr class="total-row">
      <td colspan="10"></td>
      <td colspan="4" class="lbl total-lbl">合　計</td>
      <td colspan="2" class="text-r total-val">${fmtCurrency(calcResult.totalAmount)}円</td>
    </tr>
    <tr class="total-row">
      <td colspan="10"></td>
      <td colspan="4" class="lbl total-lbl">（税込）</td>
      <td colspan="2" class="text-r total-val">${fmtCurrency(calcResult.includingTax)}円</td>
    </tr>

    ${mgmtNo}

  </table>
</div>`;
}
