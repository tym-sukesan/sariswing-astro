
//menu

var state = false;
var scrollpos;
$(function(){
	$('.menu-btn').click(function() {
		if(state == false) {
			scrollpos = $(window).scrollTop();
			$('body').addClass('fixed').css({'top': -scrollpos});
			$('#navsp').addClass('open').slideDown();
			$(this).addClass('active');
			state = true;
		} else {
			$('body').removeClass('fixed').css({'top': 0});
			window.scrollTo( 0 , scrollpos );
			$('#navsp').removeClass('open').slideUp();
			$(this).removeClass('active');
			state = false;
		}
	});
});
function adjustHeight() {
	var vh = window.innerHeight - 48;
	$("#navsp").css("max-height", vh + "px");
}

window.addEventListener('load', function() {
	adjustHeight();
});

window.addEventListener('resize', function() {
	adjustHeight();
});

// インスタグラム
$(function() {
    var accessToken = '579433356.2e62d22.a0df747fe51043b193df61ccbaa619ba';
    var userid = 579433356; // ユーザーID
    var count = 8; // 取得件数
    $.ajax({
        url: 'https://api.instagram.com/v1/users/' + userid + '/media/recent/?access_token=' + accessToken + '&count=' + count,
        dataType: 'jsonp',
        success: function(data) {
            var insert = '<ul>';
            for (var i = 0; i < data['data'].length; i++) {
                insert += '<li>';
 
                    // 画像とリンク先
                    insert += '<a href="' + data['data'][i]['link'] + '" target="_blank">';
                    insert += '<img src="' + data['data'][i]['images']['standard_resolution']['url'] + '" class="instagram-image" />';
                    insert += '</a>';
 
                    insert += '<div class="instagram-data">';
 
                        // 日付
                        var d = new Date(data['data'][i]['created_time'] * 1000);
                        var year  = d.getFullYear();
                        var month = d.getMonth() + 1;
                        var day  = d.getDate();
                        insert += '<div class="date">' + year + '/' + month + '/' + day + '</div>';
 
                        // caption
                        if(data['data'][i]['caption'] != null) {
                            insert += '<p class="caption">' + data['data'][i]['caption']['text'] + '</p>';
                        }
 
                        // いいね
                        insert += '<div class="instagram-like">';
                        insert += '<div class="like-count">いいね数: ' + data['data'][i]['likes']['count'] + '</div>';
                        if(data['data'][i]['likes']['data'] != null) {
                            for (var j = 0; j < data['data'][i]['likes']['data'].length; j++) {
                                insert += '<div class="like-user">';
                                insert += '<img src="' + data['data'][i]['likes']['data'][j]['profile_picture'] + '" width="240" alt="" class="like-user-icon" />';
                                insert += '<div class="like-user-name">' + data['data'][i]['likes']['data'][j]['username'] + '</div>';
                                insert += '</div>';
                            };
                        }
                        insert += '</div>';
 
                    insert += '</div>'; // instagram-data END
 
                    // コメント
                    insert += '<div class="instagram-comments">';
                    insert += '<div class="comments-count">コメント数: ' + data['data'][i]['comments']['count'] + '</div>';
                    if(data['data'][i]['comments']['data'] != null) {
                        for (var j = 0; j < data['data'][i]['comments']['data'].length; j++) {
                            insert += '<div class="comments-user">';
                            insert += '<img src="' + data['data'][i]['comments']['data'][j]['from']['profile_picture'] + '" width="50" alt="" class="comments-user-icon" />';
                            insert += '<div class="comments-user-name">' + data['data'][i]['comments']['data'][j]['from']['username'] + '</div>';
                            insert += '<p class="comments-user-text">' + data['data'][i]['comments']['data'][j]['text'] + '</p>';
                            insert += '</div>';
                        };
                    }
                    insert += '</div>';
 
                insert += '</li>';
            };
            insert += '</ul>';
            $('#sample').append(insert);
        }
    });
});



/*
* scroll
*/

$(function(){
   // #で始まるアンカーをクリックした場合に処理
   $('a[href^="#"]').click(function() {
      // スクロールの速度
      var speed = 300; // ミリ秒
      // アンカーの値取得
      var href= $(this).attr("href");
      // 移動先を取得
      var target = $(href == "#" || href == "" ? 'html' : href);
      // 移動先を数値で取得
      var position = target.offset().top;
      // スムーススクロール
      $('body,html').animate({scrollTop:position}, speed, 'swing');
      return false;
   });
});

var showFlag = false;
var topBtn = $('.pagetop');
topBtn.css('bottom', '-120px');
$(window).scroll(function () {
    if ($(this).scrollTop() > 250) {
        if (showFlag == false) {
            showFlag = true;
            topBtn.stop().animate({'bottom' : '20px'}, 300);
        }
    } else {
        if (showFlag) {
            showFlag = false;
            topBtn.stop().animate({'bottom' : '-120px'}, 300);
        }
    }
});


/*
* css swicher
*/
function css_browser_selector(u){
	var ua=u.toLowerCase(),
	is=function(t){return ua.indexOf(t)>-1},
	e='edge',g='gecko',w='webkit',s='safari',o='opera',m='mobile',
	h=document.documentElement,
	b=[
		( !(/opera|webtv/i.test(ua)) && /msie\s(\d)/.test(ua))? ('ie ie'+RegExp.$1) :
			!(/opera|webtv/i.test(ua)) && is('trident') && /rv:(\d+)/.test(ua)? ('ie ie'+RegExp.$1) :
			is('edge/')? e:
			is('firefox/2')?g+' ff2':
			is('firefox/3.5')? g+' ff3 ff3_5' :
			is('firefox/3.6')?g+' ff3 ff3_6':is('firefox/3')? g+' ff3' :
			is('gecko/')?g:
			is('opera')? o+(/version\/(\d+)/.test(ua)? ' '+o+RegExp.$1 :
			(/opera(\s|\/)(\d+)/.test(ua)?' '+o+RegExp.$2:'')) :
			is('konqueror')? 'konqueror' :
			is('blackberry')?m+' blackberry' :
			is('android')?m+' android' :
			is('chrome')?w+' chrome' :
			is('iron')?w+' iron' :
			is('applewebkit/')? w+' '+s+(/version\/(\d+)/.test(ua)? ' '+s+RegExp.$1 : '') :
			is('mozilla/')? g:
			'',
			is('j2me')?m+' j2me':
			is('iphone')?m+' iphone':
			is('ipod')?m+' ipod':
			is('ipad')?m+' ipad':
			is('mac')?'mac':
			is('darwin')?'mac':
			is('webtv')?'webtv':
			is('win')? 'win'+(is('windows nt 6.0')?' vista':''):
			is('freebsd')?'freebsd':
			(is('x11')||is('linux'))?'linux':
			'',
			'js'];
	c = b.join(' ');
	h.className += ' '+c;
	return c;
};
css_browser_selector(navigator.userAgent);


$(function() {
    $('.target').css('opacity', 0);
    $('.target').on('inview', function(event, isInView, visiblePartX, visiblePartY) {
        if (isInView) {
            if (visiblePartY == 'both') {
                $(this).stop().animate({opacity: 1}, 2500);
            }
        }
    });
});

$(function() {
    $('.target_b').css('opacity', 0);
    $('.target_b').on('inview', function(event, isInView, visiblePartX, visiblePartY) {
        if (isInView) {
            if (visiblePartY == 'both') {
                $(this).stop().animate({opacity: 1}, 7000);
            }
        }
    });
});
