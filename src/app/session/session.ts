// import {xuiNode} from '@hmcts/rpx-xui-node-lib';
// import {NextFunction, Request, Response} from 'express';
// // import {getConfigValue, showFeature} from '../configuration'
// // import {
// //     COOKIE_ROLES,
// //     COOKIES_TOKEN,
// //     COOKIES_USER_ID,
// //     FEATURE_OIDC_ENABLED,
// //     FEATURE_REDIS_ENABLED,
// //     FEATURE_SECURE_COOKIE_ENABLED,
// //     IDAM_SECRET, LOGIN_ROLE_MATCHER,
// //     MICROSERVICE,
// //     NOW,
// //     REDIS_CLOUD_URL,
// //     REDIS_KEY_PREFIX,
// //     REDIS_TTL,
// //     S2S_SECRET,
// //     SERVICE_S2S_PATH,
// //     SERVICES_IDAM_API_URL,
// //     SERVICES_IDAM_CLIENT_ID,
// //     SERVICES_IDAM_ISS_URL,
// //     SERVICES_IDAM_LOGIN_URL,
// //     SERVICES_IDAM_OAUTH_CALLBACK_URL,
// //     SESSION_SECRET
// // } from '../configuration/references'
// // import * as log4jui from '../lib/log4jui'

// // const logger = log4jui.getLogger('auth')

// // export const successCallback = (req: Request, res: Response, next: NextFunction) => {
// //     const {user} = req.session.passport
// //     const {roles} = user.userinfo
// //     const {userinfo} = user
// //     const {accessToken} = user.tokenset
// //     const cookieToken = getConfigValue(COOKIES_TOKEN)
// //     const cookieUserId = getConfigValue(COOKIES_USER_ID)
// //     const cookieRoles = getConfigValue(COOKIE_ROLES)

// //     logger.info('Setting session and cookies')

// //     res.cookie(cookieUserId, userinfo.uid)
// //     res.cookie(cookieToken, accessToken)
// //     res.cookie(cookieRoles, roles)

// //     if (!req.isRefresh) {
// //         return res.redirect('/')
// //     }
// //     next()
// // }

// // xuiNode.on(AUTH.EVENT.AUTHENTICATE_SUCCESS, successCallback)

// export const getXuiNodeMiddleware = () => {

//     const baseStoreOptions = {
//         cookie: {
//             httpOnly: true,
//             maxAge: 28800000,
//             secure: true,
//         },
//         rolling: true,
//         name: 'ccpay-webapp',
//         resave: true,
//         saveUninitialized: false,
//         secret: 'ggg'
//     };

//     const redisStoreOptions = {
//         redisStore: {
//             ...baseStoreOptions, ...{
//                 redisStoreOptions: {
//                     redisCloudUrl: 'redis://localhost:6379',
//                     redisKeyPrefix: 'paybubble123',
//                     redisTtl: 86200,
//                 },
//             },
//         },
//     };

//     const nodeLibOptions = {
//         session: redisStoreOptions,
//     };

//     return xuiNode.configure(nodeLibOptions);
// };
