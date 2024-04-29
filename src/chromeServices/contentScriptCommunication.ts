import {
	Action,
	IChromeMessage,
	IMessageResponse,
	Sender,
	// TVersionData,
} from '../types/types';
// import { convertMsToHr } from '../utils/utils';

type TResponse = (response?: IMessageResponse) => void;

interface IValidateSender {
	expectedSender: Sender;
	expectedAction: Action;
	message: IChromeMessage;
	sender: chrome.runtime.MessageSender;
}

interface IRequestActionCallback {
	message: IChromeMessage;
	sender: chrome.runtime.MessageSender;
	response: TResponse;
}

// interface IReleaseActionCallback {
//     message: IChromeMessage,
// 	sender: chrome.runtime.MessageSender,
// 	response: TResponse
// }

// validates that the sender of the communication is known by the extension
const validateSender = (props: IValidateSender) => {
	return (
		props.sender.id === chrome.runtime.id &&
		props.message.from === props.expectedSender &&
		props.message.action === props.expectedAction
	);
};

// handles REQUEST actions
const requestActionCallback = (props: IRequestActionCallback) => {
	const validateSenderArgumentBody: IValidateSender = {
		expectedSender: Sender.Extension,
		expectedAction: Action.Request,
		message: props.message,
		sender: props.sender,
	};

	if (validateSender(validateSenderArgumentBody)) {
		const data = Object.assign(
			{},
			{ data: 'Data to return to the requester...' },
		);

		props.response({
			error: !data ? 'Error retrieving requested data...' : null,
			data: data,
		});
		return true; // tell the browser that we will eventually return a response
	}
	return false; // tell the browser not to expect a response
};

// TODO: needs additionaly dependencies
// handles RELEASE actions
// const releaseActionCallback = (props: IReleaseActionCallback) => {
//     const validateSenderArgumentBody: IValidateSender = {
//         expectedSender: Sender.Extension,
//         expectedAction: Action.Request,
//         message: props.message,
//         sender: props.sender
//     };

// 	if (validateSender(validateSenderArgumentBody)) {
// 		try {
// 			// request release information from local storage
// 			chrome.storage.sync.get('versionData', (data: TVersionData) => {
// 				// if it does not exist, no message passed in message request, or >5hrs since last check
// 				// get data from api request
// 				if (
// 					!props.message.message ||
// 					!props.message.message.timestamp ||
// 					props.message.message.forceCheck ||
// 					!data ||
// 					!data.timestamp ||
// 					(convertMsToHr(props.message.message.timestamp - data.timestamp) > 5)
// 				) {
// 					fetch(
// 						'https://api.github.com/repos/cmolisee/okAPI/releases/latest'
// 					)
// 						.then((res) => res.json())
// 						.then((releaseData) => {
// 							const latestVersion =
// 								releaseData['tag_name'].slice(1);

//                             // TODO: we need to somehow retrieve the users current extension version
//                             // previously this was done by placing the version in package.json into an env variable
//                             // there might be a better/different way to do it here.
// 							props.response({
//                                 error: null,
//                                 data: {
//                                     isUpToDate: latestVersion === process.env['VERSION'],
//                                     timestamp: new Date().getTime(),
//                                     releaseUrl: releaseData['html_url'],
//                                 }
//                             });
// 						})
// 						.catch((err) => {
//                             console.log(err);
//                             props.response({ error: "Error performing release version check...", data: data });
//                         });
// 				} else {
// 					// otherwise data already exists and/or is up to date
// 					props.response({ error: null, data: data });
// 				}
// 			});
// 		} catch {
// 			props.response({
// 				error: 'Error performing release version check...',
// 				data: {},
// 			});
// 		}
// 		return true; // tell the browser that we will eventually return a response
// 	}
// 	return false; // tell the browser not to expect a response
// };

const init = () => {
	// Fired when a message is sent from either an extension process or a content script.
	chrome.runtime.onMessage.addListener(requestActionCallback);
	// chrome.runtime.onMessage.addListener(releaseActionCallback);
};

init();
