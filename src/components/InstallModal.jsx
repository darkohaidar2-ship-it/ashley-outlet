import React from 'react';
import { 
  X, 
  Download, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  Smartphone, 
  Sparkles 
} from 'lucide-react';

export default function InstallModal({
  isOpen,
  onClose,
  isInstalled,
  isIOS,
  onNativeInstall,
  hasNativePrompt,
  lang = 'ku'
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn no-print">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 p-6 relative animate-scaleUp">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
              {lang === 'ar' ? 'تثبيت التطبيق على الجهاز' : lang === 'en' ? 'Install Standalone App' : 'دابەزاندنی ئەپڵیکەیشن'}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ashley Furniture Outlet Digital Album
            </p>
          </div>
        </div>

        {/* Case 1: Already Installed */}
        {isInstalled ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-800 text-base">
              {lang === 'ar' ? 'التطبيق مثبت بالفعل!' : lang === 'en' ? 'App is Already Installed!' : 'ئەپڵیکەیشنەکە لەسەر ئامێرەکەت دامەزراوە!'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {lang === 'ar' 
                ? 'يمكنك فتح الكتالوج مباشرة من الشاشة الرئيسية بدون متصفح.' 
                : lang === 'en' 
                ? 'You can launch the catalog directly from your home screen as a standalone app.' 
                : 'دەتوانیت لە ڕێگەی ئایکۆنی سەر مێزی ئایپاد/مۆبایلەکەتەوە وەک ئەپێکی سەربەخۆ بەکاریبهێنیت.'}
            </p>
            <button
              onClick={onClose}
              className="mt-5 w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-all shadow-sm"
            >
              داخستن
            </button>
          </div>
        ) : isIOS ? (
          /* Case 2: iPad / iPhone Safari instructions */
          <div className="space-y-4 pt-1">
            <div className="bg-red-50/70 border border-red-100 rounded-2xl p-3 text-xs text-red-950 font-medium">
              <div className="flex items-center gap-1.5 font-bold text-red-700 mb-1">
                <Sparkles className="w-4 h-4 text-red-600" />
                <span>ڕێنمایی ئایپاد و تابلێتی ئەپڵ (iPad / iPhone)</span>
              </div>
              لەبەر پاراستنی سیستەمی ئەپڵ، بۆ کردنی وێبسایتەکە بە ئەپێکی سەربەخۆ لەسەر شاشەی ئایپادەکەت، تەنها ئەم سێ هەنگاوە بکە:
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 font-medium">
              
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1">
                  <p className="leading-snug">
                    لە سەرەوەی وێبگەڕی Safari، دوگمەی <strong>Share</strong> (هاوبەشکردن) دابگرە.
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold text-[11px]">
                    <Share className="w-3.5 h-3.5 text-blue-600" />
                    <span>هێمای چوارگۆشە بە تیر بەرەو سەرەوە</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1">
                  <p className="leading-snug">
                    لە لیستەکە وەرگێڕە بۆ خوارەوە و کلیک لەسەر <strong>Add to Home Screen</strong> (زیادکردن بۆ سەر شاشە) بکە.
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold text-[11px]">
                    <PlusSquare className="w-3.5 h-3.5 text-slate-800" />
                    <span>Add to Home Screen</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1">
                  <p className="leading-snug">
                    لە گۆشەی سەرەوە دوگمەی <strong>Add</strong> دابگرە.
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    ئەلبوومەکە وەک ئەپێکی خێرا و سەربەخۆ دەکەوێتە سەر شاشەی ئایپادەکەت بەبێ پێویستی بە گەڕان لە گووگڵ!
                  </p>
                </div>
              </div>

            </div>

            <button
              onClick={onClose}
              className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-md"
            >
              تێگەیشتم / داخستن
            </button>

          </div>
        ) : (
          /* Case 3: Android / Chrome / Windows / Mac Native Install */
          <div className="space-y-4 pt-1">
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              بە دابەزاندنی ئەم ئەپڵیکەیشنە:
            </p>

            <ul className="space-y-2 text-xs text-slate-700 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>پێویست بە گەڕان ناکات لە ئینتەرنێت، بە یەک کلیک لەسەر شاشەکەت دەکرێتەوە.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>بە شێوازی فول-سکرین و بێ هێڵی سەرەوەی وێبگەڕ کاردەکات وەک ئەپی ئایپاد.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>زۆر خێراترە و هەموو کات لەبەر دەستی فرۆشیار و کڕیاردا دەبێت.</span>
              </li>
            </ul>

            {hasNativePrompt ? (
              <button
                onClick={onNativeInstall}
                className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-98 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>داگرتن و دامەزراندنی ئەپ</span>
              </button>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                لە مێنیوی وێبگەڕەکەتدا (سێ خاڵەکەی سەرەوە <strong>⋮</strong>)، بژاردەی <strong>"Install app"</strong> یان <strong>"Add to Home Screen"</strong> هەڵبژێرە.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
