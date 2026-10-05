/**
 * Penyegerakan PWA Jawi (https://rumijawi.vercel.app) dengan helaian ini.
 *
 * Pemasangan (sekali sahaja):
 *  1. Sambungan > Apps Script > (+) Fail baharu > Skrip, namakan "pwa-sync", tampal fail ini, Simpan.
 *  2. Pilih fungsi pasangPWA dan klik Jalankan. Benarkan akses. Catat KUNCI GURU yang dipaparkan.
 *  3. Kerahkan > Penggunaan baharu > Jenis: Aplikasi web.
 *     Laksanakan sebagai: Saya.  Siapa yang boleh akses: Sesiapa sahaja.
 *     Salin URL aplikasi web (berakhir dengan /exec).
 *
 * GET  ?action=versi  → { ok, versi }
 * GET  ?action=kamus  → { ok, versi, data: { rumi: jawi } }   (Kamus + Pengecualian; Pengecualian diutamakan)
 * POST { action:'semak',  kunci }              → { ok }
 * POST { action:'simpan', kunci, rumi, jawi }  → { ok, versi, baharu }   (tulis ke tab Pengecualian)
 */
const PWA_TAB_KAMUS = 'Kamus';
const PWA_TAB_PENGECUALIAN = 'Pengecualian';

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'versi';
  if (action === 'versi') return pwaJson_({ ok: true, versi: pwaVersi_() });
  if (action === 'kamus') {
    const versi = pwaVersi_(); // dibaca dahulu: suntingan semasa membaca akan mencetuskan muat turun semula
    return pwaJson_({ ok: true, versi: versi, data: pwaBacaKamus_() });
  }
  return pwaJson_({ ok: false, ralat: 'Tindakan tidak dikenali.' });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return pwaJson_({ ok: false, ralat: 'Data tidak sah.' }); }
  const kunci = PropertiesService.getScriptProperties().getProperty('PWA_KUNCI');
  if (!kunci || !body || body.kunci !== kunci) return pwaJson_({ ok: false, ralat: 'Kunci guru tidak sah.', kunci: false });
  if (body.action === 'semak') return pwaJson_({ ok: true });
  if (body.action !== 'simpan') return pwaJson_({ ok: false, ralat: 'Tindakan tidak dikenali.' });

  const rumi = String(body.rumi || '').trim().normalize('NFC').toLowerCase();
  const jawi = String(body.jawi || '').trim();
  if (!/^[a-zÀ-ɏ][a-zÀ-ɏ'’‘ -]{0,59}$/.test(rumi)) return pwaJson_({ ok: false, ralat: 'Perkataan Rumi tidak sah.' });
  if (!jawi || jawi.length > 120 || /^[=+\-@]/.test(jawi) || /[<>]/.test(jawi)) return pwaJson_({ ok: false, ralat: 'Ejaan Jawi tidak sah.' });

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(PWA_TAB_PENGECUALIAN);
    const last = sheet.getLastRow();
    const keys = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getDisplayValues() : [];
    const tarikh = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy');
    let baharu = true;
    for (let i = 0; i < keys.length; i++) {
      if (String(keys[i][0]).trim().normalize('NFC').toLowerCase() === rumi) {
        sheet.getRange(i + 2, 2).setValue(jawi);
        baharu = false;
        break;
      }
    }
    if (baharu) sheet.appendRow([rumi, jawi, 'PWA', 'Ditambah melalui PWA ' + tarikh]);
    SpreadsheetApp.flush();
    pwaTandaBerubah_();
    return pwaJson_({ ok: true, versi: pwaVersi_(), baharu: baharu });
  } finally {
    lock.releaseLock();
  }
}

/** Jalankan sekali dari editor: pasang pencetus suntingan & jana kunci guru. */
function pasangPWA() {
  const ss = SpreadsheetApp.getActive();
  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'pwaBilaBerubah'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('pwaBilaBerubah').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('pwaBilaBerubah').forSpreadsheet(ss).onChange().create();
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('PWA_KUNCI')) props.setProperty('PWA_KUNCI', Utilities.getUuid().replace(/-/g, '').slice(0, 12));
  pwaTandaBerubah_();
  const mesej = 'Penyegerakan PWA dipasang.\n\nKUNCI GURU: ' + props.getProperty('PWA_KUNCI') +
    '\n\nMasukkan kunci ini dalam PWA (Semakan Ejaan > Kunci guru) pada peranti yang dibenarkan menulis ke helaian.';
  Logger.log(mesej);
  try { SpreadsheetApp.getUi().alert(mesej); } catch (err) { /* dijalankan tanpa UI */ }
}

/** Jalankan untuk menukar kunci guru (kunci lama tidak lagi boleh menulis). */
function tukarKunciPWA() {
  PropertiesService.getScriptProperties().deleteProperty('PWA_KUNCI');
  pasangPWA();
}

/** Pencetus: suntingan / import pada Kamus atau Pengecualian menukar versi, PWA akan memuat turun semula. */
function pwaBilaBerubah(e) {
  if (e && e.range) {
    const nama = e.range.getSheet().getName();
    if (nama !== PWA_TAB_KAMUS && nama !== PWA_TAB_PENGECUALIAN) return;
  }
  pwaTandaBerubah_();
}

function pwaVersi_() {
  const props = PropertiesService.getScriptProperties();
  let v = props.getProperty('PWA_VERSI');
  if (!v) { v = String(Date.now()); props.setProperty('PWA_VERSI', v); }
  return v;
}

function pwaTandaBerubah_() {
  PropertiesService.getScriptProperties().setProperty('PWA_VERSI', String(Date.now()));
}

function pwaBacaKamus_() {
  const ss = SpreadsheetApp.getActive();
  const out = {};
  const tambah = function (rows) {
    for (let i = 0; i < rows.length; i++) {
      const k = String(rows[i][0]).trim().normalize('NFC').toLowerCase();
      const v = String(rows[i][1]).trim();
      if (k && v) out[k] = v;
    }
  };
  [PWA_TAB_KAMUS, PWA_TAB_PENGECUALIAN].forEach(function (nama) {
    const sh = ss.getSheetByName(nama);
    if (sh && sh.getLastRow() > 1) tambah(sh.getRange(2, 1, sh.getLastRow() - 1, 2).getDisplayValues());
  });
  return out;
}

function pwaJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
