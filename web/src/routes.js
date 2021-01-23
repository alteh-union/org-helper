import SignIn from './pages/sign-in';
import Plugins from './pages/plugins';
import DiscordAuth from './pages/discord-auth';


const routes = [
    {
        id: 'SignIn',
        name: 'Home',
        path: '/',
        exact: true,
        component: SignIn
    },
    {
        id: 'Plugins',
        name: 'Plugins',
        path: '/plugins',
        component: Plugins
    },
    {
        id: 'DiscordAuth',
        path: '/discord-auth',
        hiddenInHeader: true,
        component: DiscordAuth
    },
];

export default routes;
