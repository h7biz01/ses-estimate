'use strict';

// =====================================================================
// 祝日リスト（2024〜2027）
// =====================================================================
const HOLIDAYS = new Set([
  // 2024
  '2024-01-01','2024-01-08','2024-02-11','2024-02-12','2024-02-23',
  '2024-03-20','2024-04-29','2024-05-03','2024-05-04','2024-05-05',
  '2024-05-06','2024-07-15','2024-08-11','2024-08-12','2024-09-16',
  '2024-09-22','2024-09-23','2024-10-14','2024-11-03','2024-11-04',
  '2024-11-23',
  // 2025
  '2025-01-01','2025-01-13','2025-02-11','2025-02-23','2025-02-24',
  '2025-03-20','2025-04-29','2025-05-03','2025-05-04','2025-05-05',
  '2025-05-06','2025-07-21','2025-08-11','2025-09-15','2025-09-22',
  '2025-09-23','2025-10-13','2025-11-03','2025-11-23','2025-11-24',
  // 2026
  '2026-01-01','2026-01-12','2026-02-11','2026-02-23','2026-03-20',
  '2026-04-29','2026-05-03','2026-05-04','2026-05-05','2026-05-06',
  '2026-07-20','2026-08-11','2026-09-21','2026-09-22','2026-09-23',
  '2026-10-12','2026-11-03','2026-11-23',
  // 2027
  '2027-01-01','2027-01-11','2027-02-11','2027-02-23','2027-03-21',
  '2027-04-29','2027-05-03','2027-05-04','2027-05-05','2027-07-19',
  '2027-08-11','2027-09-20','2027-09-23','2027-10-11','2027-11-03',
  '2027-11-23',
]);

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function isBusinessDay(date) {
  const d = date.getDay();
  if (d === 0 || d === 6) return false;
  return !HOLIDAYS.has(toDateStr(date));
}

// 指定月の営業日数
function getBusinessDaysInMonth(year, month) {
  let count = 0;
  const days = new Date(year, month, 0).getDate();
  for (let d = 1; d <= days; d++) {
    if (isBusinessDay(new Date(year, month - 1, d))) count++;
  }
  return count;
}

// 時刻文字列 "HH:MM" → 時間数（float）
function timeToHours(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  return parseInt(parts[0] || 0) + (parseInt(parts[1] || 0)) / 60;
}

// 1日の実稼働時間
function calcDailyWorkHours(startTime, endTime, breakTime) {
  return timeToHours(endTime) - timeToHours(startTime) - timeToHours(breakTime);
}

// 基本時間 = 週稼働日数 × 1日実稼働時間 × 4週
function calcBaseHours(weeklyDays, dailyWorkHours) {
  return weeklyDays * dailyWorkHours * 4;
}

// 端数処理（10円単位）
function roundPrice(val, roundingType) {
  if (roundingType === '切上げ') return Math.ceil(val / 10) * 10;
  return Math.floor(val / 10) * 10; // 切捨て（デフォルト）
}

// 時給計算
function calcHourlyRate(unitPrice, baseHours, roundingType) {
  if (!unitPrice || !baseHours) return 0;
  return roundPrice(unitPrice / baseHours, roundingType);
}

// 作業期間（ヶ月）: 開始月〜終了月の月数
function calcMonths(startStr, endStr) {
  if (!startStr || !endStr) return 0;
  const s = new Date(startStr + 'T00:00:00');
  const e = new Date(endStr + 'T00:00:00');
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1;
  return Math.max(0, months);
}

// =====================================================================
// メイン計算関数
// =====================================================================
function calculateAll(formData) {
  const dailyWorkHours = calcDailyWorkHours(
    formData.startTime, formData.endTime, formData.breakTime
  );

  // 基本時間（手動override or 自動計算）
  const baseHours = formData.baseHoursOverride > 0
    ? formData.baseHoursOverride
    : calcBaseHours(formData.weeklyDays, dailyWorkHours);

  const isFixed = formData.settlementType === '固定';
  const isHourly = formData.settlementType === '時給';
  const hasSettlement = !isFixed && !isHourly;

  const lowerLimit = hasSettlement ? baseHours - (formData.deductionRange || 0) : null;
  const upperLimit = hasSettlement ? baseHours + (formData.excessRange || 0) : null;

  const months = calcMonths(formData.startDate, formData.endDate);

  const workerResults = [];
  let totalAmount = 0;

  for (const worker of formData.workers) {
    if (!worker.name && !(worker.unitPrice > 0)) continue;

    const price = worker.unitPrice || 0;
    let hourlyRate = 0;

    if (isHourly) {
      hourlyRate = price; // 時給の場合、単価そのものが時給
    } else if (hasSettlement) {
      hourlyRate = calcHourlyRate(price, baseHours, formData.roundingType);
    }

    const totalPrice = price * months;
    totalAmount += totalPrice;

    workerResults.push({
      name:        worker.name || '',
      nameKana:    worker.nameKana || '',
      weeklyDays:  worker.weeklyDays || formData.weeklyDays,
      unitPrice:   price,
      months,
      totalPrice,
      hourlyRate,
      deductionRate: hasSettlement ? hourlyRate : 0,
      excessRate:    hasSettlement ? hourlyRate : 0,
    });
  }

  // 日割計算
  let dailyProration = null;
  if (formData.isDailyCalc && formData.dailyStartDate && workerResults.length > 0) {
    const s = new Date(formData.dailyStartDate + 'T00:00:00');
    const businessDays = getBusinessDaysInMonth(s.getFullYear(), s.getMonth() + 1);
    const workDays = parseInt(formData.dailyWorkDays) || 0;
    const price0 = workerResults[0].unitPrice;
    const amount = price0 && businessDays ? Math.floor((price0 / businessDays) * workDays) : 0;
    dailyProration = { unitPrice: price0, businessDays, workDays, amount };
  }

  const taxAmount   = Math.floor(totalAmount * 0.1);
  const includingTax = totalAmount + taxAmount;

  return {
    baseHours:    hasSettlement ? baseHours : null,
    lowerLimit,
    upperLimit,
    workers:      workerResults,
    totalAmount,
    taxAmount,
    includingTax,
    dailyProration,
    dailyWorkHours,
  };
}
