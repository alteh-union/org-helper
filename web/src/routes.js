import Main from './pages/main';
import Plugins from './pages/plugins';
import DiscordAuth from './pages/discord-auth';


const routes = [
    {
        id: 'Main',
        name: 'Home',
        path: '/',
        exact: true,
        component: Main
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
    }
];

export default routes;
