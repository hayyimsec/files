// Template Handlers

Handlebars.registerHelper('ifeq', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('ifneq', function(arg1, arg2, options) {
    return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
});

// Locale

if (!localStorage.locale) {
    locale = navigator.language.substr(0, 2).toLowerCase() == 'ko' ? 'ko-KR' : 'en-US';
} else {
    locale = localStorage.locale;
}

const setLocale = (_locale) => (_locale == 'ko-KR' || _locale == 'en-US') && (localStorage.locale = locale = _locale, reinit(false));

// Layout

const getDeviceType = () => innerWidth <= 968 ? 'mobile' : 'desktop';
history.scrollRestoration && (history.scrollRestoration = 'manual');

// Motd

const MOTD =
    "                                                                                          .         .           \n" +
    "8 8888        8          .8.      `8.`8888.      ,8' `8.`8888.      ,8'  8 8888          ,8.       ,8.          \n" +
    "8 8888        8         .888.      `8.`8888.    ,8'   `8.`8888.    ,8'   8 8888         ,888.     ,888.         \n" +
    "8 8888        8        :88888.      `8.`8888.  ,8'     `8.`8888.  ,8'    8 8888        .`8888.   .`8888.        \n" +
    "8 8888        8       . `88888.      `8.`8888.,8'       `8.`8888.,8'     8 8888       ,8.`8888. ,8.`8888.       \n" +
    "8 8888        8      .8. `88888.      `8.`88888'         `8.`88888'      8 8888      ,8'8.`8888,8^8.`8888.      \n" +
    "8 8888        8     .8`8. `88888.      `8. 8888           `8. 8888       8 8888     ,8' `8.`8888' `8.`8888.     \n" +
    "8 8888888888888    .8' `8. `88888.      `8 8888            `8 8888       8 8888    ,8'   `8.`88'   `8.`8888.    \n" +
    "8 8888        8   .8'   `8. `88888.      8 8888             8 8888       8 8888   ,8'     `8.`'     `8.`8888.   \n" +
    "8 8888        8  .888888888. `88888.     8 8888             8 8888       8 8888  ,8'       `8        `8.`8888.  \n" +
    "8 8888        8 .8'       `8. `88888.    8 8888             8 8888       8 8888 ,8'         `         `8.`8888. \n";

console.log(`%c${MOTD} `, 'font-family: Consolas;');
console.log(`%cWE ARE HIRING! See ${origin}/media/Recruit.docx`, 'font-family: Consolas; filter: blur(4px)');

// Main

const BASE_URL = '/gh/hayyimsec/files@db70055e3158536924d01728b9cb12f82e6cd5d7/www/';

let deviceType = getDeviceType();

let slide_index = -1;
let page = 1;
let scrolllock = false;
let lastTouch = null;
let lastProgress = null;
let slides = null;
let swiper = null;
let service_swiper = null;
let chance = 0;

let slideLoop = null;

function loadHTML() {
    return new Promise(async(resolve) => {
        const locale_response = await fetch(`${BASE_URL}/locales/${locale}.json`);
        const data = await locale_response.json();

        const template_response = await fetch(`${BASE_URL}/templates/index.${deviceType}.html`);
        const html = await template_response.text();

        $('#page-content').html(Handlebars.compile(html)(Object.assign(data, { locale })));
        resolve(true);
    });
};

function setupListeners() {
    return new Promise((resolve) => {
        $('#lang-btn').click(() => {
            $('#lang-btn').toggleClass('opened');
        });

        $('#mobile-menu-btn').click(() => {
            $('#mobile-menu-btn').toggleClass('opened');
            $('#mobile-sidebar').toggleClass('opened');
        });

        $('#menu-btn').click(() =>
            $('#sidebar').addClass('opened')
        );

        $('.sidebar-leftpane').click(() =>
            $('#sidebar').removeClass('opened')
        );

        $(window).on('resize', () => {
            if (deviceType != getDeviceType()) {
                deviceType = deviceType == 'mobile' ? 'desktop' : 'mobile';
                reinit(true);
            }
        });

        let oldDelta = 0;

        $(window).on('wheel', (e) => {
            const delta = e.originalEvent.deltaY;

            if (window.navigator.platform.toLowerCase().indexOf('mac') != -1) {
                const absDelta = Math.abs(delta);

                if (absDelta <= oldDelta) {
                    oldDelta = absDelta;
                    return;
                }

                oldDelta = absDelta;
            }

            switch (deviceType) {
                case 'mobile':
                    if (delta < 0 && page == 2 && swiper.progress == 0) { // up
                        if (chance-- <= 0) {
                            page = 1;
                            $('.mobile.presentation:last-child').animate({
                                top: '100vh',
                                opacity: '0'
                            }, 0);
                        }
                    }
                    if (delta > 0) { // down
                        if (page == 1) {
                            page = 2;
                            $('.mobile.presentation:last-child').animate({
                                top: '0',
                                opacity: '1'
                            }, 0);
                        } else {
                            chance = 3;
                        }
                    }
                    break;
                case 'desktop':
                    delta < 0 && (page < 3 || swiper.progress == 0) && setPage(page - 1); // up
                    delta > 0 && page < 3 && setPage(page + 1); // down

                    $('#sidebar').removeClass('opened');
                    break;
            }
        });

        $('.presentation').on('touchstart', (e) => {
            if (deviceType == 'mobile') {
                lastTouch = e.touches[0];
                lastProgress = swiper.progress;
            }
        });


        $('.presentation').on('touchend', (e) => {
            if (deviceType == 'mobile') {
                let touch = e.changedTouches[0];

                if (lastTouch && lastTouch.clientY < touch.clientY - 100) { // scroll up
                    if (page != 1 && lastProgress == 0 && swiper.progress == 0) {
                        page = 1;
                        $('.mobile.presentation:last-child').animate({
                            top: '100vh',
                            opacity: '0'
                        }, 0);
                    }
                } else if (lastTouch && lastTouch.clientY > touch.clientY + 100) { // scroll down
                    if (page != 2) {
                        page = 2;
                        $('.mobile.presentation:last-child').animate({
                            top: '0',
                            opacity: '1'
                        }, 0);
                    }
                }
            }
        });

        $(window).on('resize', () => {
            switch (deviceType) {
                case 'desktop':
                    setTimeout(() => {
                        swiper.params.slidesOffsetAfter = -(window.innerWidth) + 538;
                        swiper.params.width = innerWidth > 1920 ? 540 : 420;

                        swiper.update();
                    }, 300);

                    window.scrollTo({ left: 0, top: page == 1 ? 0 : window.innerHeight * (page - 1) + 1, behavior: 'auto' });
                    break;
                case 'mobile':
                    setTimeout(() => swiper.update(), 600);
                    break;
            }
        });

        resolve(true);
    });
}

function initSlide() {
    return new Promise((resolve) => {
        slides = $('.intro');

        (function nextSlide() {
            slides.eq(slide_index++ % slides.length).removeClass('active');
            slides.eq(slide_index % slides.length).addClass('active');

            slideLoop = setTimeout(nextSlide, 6000);
        })();

        resolve(true);
    });
}

function setupSwiper() {
    return new Promise((resolve) => {
        switch (deviceType) {
            case 'mobile':
                swiper = new Swiper('.swiper-container', {
                    freeMode: true,
                    direction: 'vertical',
                    slidesPerView: 'auto',
                    slidesOffsetBefore: 80,
                    slidesOffsetAfter: 80,
                    spaceBetween: 12,
                    scrollbar: {
                        el: '.swiper-scrollbar',
                        dragSize: 'auto',
                    },
                    mousewheel: {
                        sensitivity: 1.0,
                    },
                    autoHeight: true,
                    grabCursor: true
                });

                break;
            case 'desktop':
                swiper = new Swiper('.posts .swiper-container', {
                    freeMode: true,
                    direction: 'horizontal',
                    width: innerWidth > 1920 ? 540 : 420,
                    spaceBetween: 40,
                    slidesOffsetBefore: 18,
                    slidesOffsetAfter: -(window.innerWidth) + 538,
                    mousewheel: {
                        sensitivity: 1.0,
                    },
                    scrollbar: {
                        el: '.swiper-scrollbar',
                        dragSize: 'auto',
                    },
                });


                service_swiper = new Swiper('.services .swiper-container', {
                    navigation: {
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev',
                    },
                });

                break;
        }

        resolve(true);
    });
}

function setPage(_page, animationTime = 600) {
    if (!scrolllock) {
        scrolllock = true, page = _page;

        $("html").stop().animate({ scrollTop: _page == 1 ? 0 : window.innerHeight * (_page - 1) + 1 }, animationTime, 'swing', () => {
            scrolllock = false;
        });
    }
}

function reinit(resetPage = false) {
    if (resetPage) {
        page = 1;
    }

    $('#page-content').animate({ 'opacity': '0' }, 300, () => {

        $("html").stop().animate({ scrollTop: 0 }, 10, 'swing', () => {
            $(window).off('resize');
            $(window).off('wheel');

            clearTimeout(slideLoop);

            chance = 0;
            scrolllock = false;

            swiper && !swiper.destroyed && swiper.destroy();
            service_swiper && !service_swiper.destroyed && service_swiper.destroy();

            (async() => {
                await init();
                await restoreState();
            })();
        });
    });
}

function restoreState() {
    return new Promise((resolve) => {

        switch (deviceType) {
            case 'mobile':
                if (page == 2) {
                    $('.mobile.presentation:last-child').css({ 'transition': 'none' });

                    $('.mobile.presentation:last-child').css({
                        top: '0',
                        opacity: '1'
                    });
                    setTimeout(() => {
                        $('.mobile.presentation:last-child').css({ 'transition': '' });
                    }, 100);

                }
                break;
            case 'desktop':
                setPage(page, 0);

                break;
        }

        $('#page-content').delay(0).animate({ 'opacity': 1 }, 300);
        resolve(true);
    });
}

function init() {
    return new Promise(async(resolve) => {
        await loadHTML();
        await setupListeners();
        await initSlide();
        await setupSwiper();

        resolve(true);
    });
}

init();
