'use strict';

// =====================================================================
// Supabase 操作
// =====================================================================
let _sb = null;

function initSupabase(url, key) {
  if (!url || !key) { _sb = null; return false; }
  try {
    _sb = window.supabase.createClient(url, key);
    return true;
  } catch(e) {
    console.error('Supabase init error:', e);
    _sb = null;
    return false;
  }
}

function isSupabaseReady() { return !!_sb; }

// 一覧取得（最新更新順）
async function dbLoadList() {
  if (!_sb) return { data: [], error: '未設定' };
  const { data, error } = await _sb
    .from('ses_estimates')
    .select('id,title,client_name,is_bp,created_at,updated_at')
    .order('updated_at', { ascending: false });
  return { data: data || [], error: error?.message };
}

// 1件取得
async function dbLoad(id) {
  if (!_sb) return { data: null, error: '未設定' };
  const { data, error } = await _sb
    .from('ses_estimates')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error: error?.message };
}

// 新規保存
async function dbSave(title, formData) {
  if (!_sb) return { data: null, error: '未設定' };
  const { data, error } = await _sb
    .from('ses_estimates')
    .insert({
      title,
      client_name: formData.clientName || '',
      is_bp: !!formData.isBP,
      form_data: formData,
    })
    .select('id')
    .single();
  return { data, error: error?.message };
}

// 上書き保存
async function dbUpdate(id, title, formData) {
  if (!_sb) return { data: null, error: '未設定' };
  const { data, error } = await _sb
    .from('ses_estimates')
    .update({
      title,
      client_name: formData.clientName || '',
      is_bp: !!formData.isBP,
      form_data: formData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id')
    .single();
  return { data, error: error?.message };
}

// 削除
async function dbDelete(id) {
  if (!_sb) return { error: '未設定' };
  const { error } = await _sb.from('ses_estimates').delete().eq('id', id);
  return { error: error?.message };
}
