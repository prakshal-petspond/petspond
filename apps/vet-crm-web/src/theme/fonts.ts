import localFont from 'next/font/local';

export const comfortaa = localFont({
  src: [
    {
      path: '../assets/fonts/Comfortaa/static/Comfortaa-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Comfortaa/static/Comfortaa-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Comfortaa/static/Comfortaa-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Comfortaa/static/Comfortaa-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Comfortaa/static/Comfortaa-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-comfortaa',
  display: 'swap',
});

export const dmSans = localFont({
  src: [
    {
      path: '../assets/fonts/DM_Sans/static/DMSans-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../assets/fonts/DM_Sans/static/DMSans-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/DM_Sans/static/DMSans-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../assets/fonts/DM_Sans/static/DMSans-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../assets/fonts/DM_Sans/static/DMSans-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-dm-sans',
  display: 'swap',
});
