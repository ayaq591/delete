/* myFunctions.js
 - Handles language toggle, form validation, apps storage (localStorage) and navigation
 - Uses jQuery for some DOM helpers (page includes jQuery CDN)
*/

(function(window, $){
  const STORAGE_KEY = 'ai_apps_v1';
  const LANG_KEY = 'site_lang';

  function getApps(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]') }catch(e){return[]} }
  function saveApps(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)) }

  function setLang(lang){
    if(lang==='ar') $('body').addClass('lang-ar'); else $('body').removeClass('lang-ar');
    localStorage.setItem(LANG_KEY, lang);
    $('.lang-btn').removeClass('active');
    $(`.lang-btn[data-lang="${lang}"]`).addClass('active');
    // flip text content for small UI labels if present
    $('[data-i18n]').each(function(){
      const key = $(this).attr('data-i18n');
      const txt = i18n[key] && i18n[key][lang] ? i18n[key][lang] : $(this).data('fallback') || $(this).text();
      $(this).text(txt);
    });
  }

  const i18n = {
    'students_title': {ar:'أسماء الطلاب', en:'Students Names'},
    'website_link': {ar:'رابط النشر على الإنترنت', en:'Website Link'},
    'add_app': {ar:'إضافة تطبيق', en:'Add App'}
  };

  $(function(){
    // attach language toggle
    $('.lang-btn').on('click', function(){
      const lang = $(this).data('lang');
      setLang(lang);
    });

    // init lang from storage or default to arabic
    const currentLang = localStorage.getItem(LANG_KEY) || 'ar';
    setLang(currentLang);

    // add_app.html form handling
    if($('#addAppForm').length){
      $('#addAppForm').on('submit', function(e){
        e.preventDefault();
        // read values
        const name = $('#appName').val().trim();
        const company = $('#appCompany').val().trim();
        const url = $('#appURL').val().trim();
        const domain = $('#appDomain').val();
        const free = $('input[name="free"]:checked').val();
        const desc = $('#appDesc').val().trim();

        // validations
        const alphaNoSpace = /^[A-Za-z]+$/;
        const alphaSpace = /^[A-Za-z\s]+$/;
        const urlRegex = /^(https?:\/\/)[\w\-]+(\.[\w\-]+)+([\w\-.,@?^=%&:/~+#]*[\w\-@?^=%&/~+#])?$/;

        let errors = [];

        if(!alphaNoSpace.test(name)){
          errors.push('اسم التطبيق بالإنجليزية يجب أن يحتوي أحرف إنكليزية فقط وبدون فراغات');
        }
        if(!alphaSpace.test(company)){
          errors.push('اسم الشركة بالإنجليزية يجب أن يحتوي أحرف إنكليزية فقط');
        }
        if(!urlRegex.test(url)){
          errors.push('رابط الموقع يجب أن يبدأ بـ http:// أو https://');
        }
        if(!domain){
          errors.push('اختر مجال الاستخدام.');
        }
        if(!desc || desc.length<10){
          errors.push('الشرح المختصر');
        }

        if(errors.length){
          alert(errors.join('\n'));
          return;
        }

         // build app object
        const app = {
          id: 'app_'+Date.now(),
          name, company, url, domain, free: free==='true', desc,
          // إضافة حقل اللوغو (استخدم رابط افتراضي)
          logo_url: 'https://via.placeholder.com/80x80?text=App+Logo', 
          created: new Date().toISOString()
        };

        const arr = getApps();
        arr.push(app);
        saveApps(arr);
        // redirect to apps.html
        window.location.href = 'apps.html';
      });

      $('#resetBtn').on('click', function(){ if($('.details-btn').length){
        $('.details-btn').on('click', function(){
            const desc = $(this).data('desc');
            const url = $(this).data('url');
            let detailsMessage = desc;
            if(url) {
                detailsMessage += `\n\nالموقع الإلكتروني: ${url}`;
            }
            $('#addAppForm')[0].reset(); });
          }});
    }

    // apps.html render
    if($('#appstable').length){
      function renderApps(){
        const arr = getApps();
        const $tbody = $('#appstable tbody');
        $tbody.empty();
        if(!arr.length){
          $tbody.append('<tr><td colspan="6" style="text-align:center;color:#94a3b8">No apps yet. Use Add App to create one.</td></tr>');
          return;
        }
        arr.forEach(function(a){
          const tr = $('<tr/>');
          tr.append('<td>'+escapeHtml(a.name)+'</td>');
          tr.append('<td>'+escapeHtml(a.company)+'</td>');
          tr.append('<td>'+(a.free? 'Free':'Paid')+'</td>');
          tr.append('<td>'+escapeHtml(a.domain)+'</td>');
          const btn = $('<button class="show-details">Show Details</button>');
          const tdBtn = $('<td/>').append(btn);
          tr.append(tdBtn);
          const tdLink = $('<td/>').append('<a href="'+a.url+'" target="_blank">Open</a>');
          tr.append(tdLink);
          $tbody.append(tr);

            // 1. بناء عنصر الملتيميديا (اللوغو) ورابط الموقع
          const mediaAndUrlHtml = '<div style="display:flex;align-items:center;gap:15px;margin-bottom:10px;">'
            + '<img src="' + escapeHtml(a.logo_url) + '" alt="App Logo" style="width:80px;height:80px;border-radius:8px;object-fit:cover;border:1px solid #f0f0f0;">'
            + '<div>'
            + '<strong>عنوان الموقع:</strong><br>'
            + '<a href="' + escapeHtml(a.url) + '" target="_blank">' + escapeHtml(a.url) + '</a>'
            + '</div>'
            + '</div>';

          // 2. بناء صف التفاصيل كاملاً
          const details = $('<tr class="details-row"><td colspan="6"><div class="details" id="det-'+a.id+'">'
            // إدراج الملتيميديا ورابط الموقع
            + mediaAndUrlHtml
            +'<p><strong>شرح مختصر:</strong> '+escapeHtml(a.desc)+'</p>'
            +'<p style="font-size:12px;color:var(--muted)">تم الإضافة في: '+(new Date(a.created)).toLocaleString()+'</p>'
            +'</div></td></tr>');

          $tbody.append(details);

          btn.on('click', function(){
            const $d = $('#det-'+a.id).parent();
            $d.find('.details').toggleClass('open');
          });
        });
      }
      renderApps();
     
    }

    // helper escape HTML
    function escapeHtml(text){ return String(text||'').replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }
  });
})(window, jQuery);
