import Signin from './pages/signin';
import Plugins from './pages/plugins';


const routes = [
    {
        id: 'Signin',
        name: 'Home',
        path: '/',
        exact: true,
        component: Signin
    },
    // {
    //     id: 'Server',
    //     path: '/server',
    // },
    {
        id: 'Plugins',
        name: 'Plugins',
        path: '/plugins',
        component: Plugins
    },
];

export default routes;
