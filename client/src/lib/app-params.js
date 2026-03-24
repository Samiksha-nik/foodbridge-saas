const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

const toSnakeCase = (str) => {
	return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
	if (isNode) {
		return defaultValue;
	}
	const storageKey = `base44_${toSnakeCase(paramName)}`;
	const urlParams = new URLSearchParams(window.location.search);
	const searchParam = urlParams.get(paramName);
	if (removeFromUrl) {
		urlParams.delete(paramName);
		const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""
			}${window.location.hash}`;
		window.history.replaceState({}, document.title, newUrl);
	}
	if (searchParam) {
		storage.setItem(storageKey, searchParam);
		return searchParam;
	}
	if (defaultValue) {
		storage.setItem(storageKey, defaultValue);
		return defaultValue;
	}
	const storedValue = storage.getItem(storageKey);
	if (storedValue) {
		return storedValue;
	}
	return null;
}

const getAppParams = () => {
	if (getAppParamValue("clear_access_token") === 'true') {
		storage.removeItem('base44_access_token');
		storage.removeItem('token');
	}
	return {
		appId: getAppParamValue("app_id", { defaultValue: import.meta.env.VITE_BASE44_APP_ID }),
		token: getAppParamValue("access_token", { removeFromUrl: true }),
		fromUrl: getAppParamValue("from_url", { defaultValue: window.location.href }),
		functionsVersion: getAppParamValue("functions_version", { defaultValue: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION }),
		appBaseUrl: getAppParamValue("app_base_url", { defaultValue: import.meta.env.VITE_BASE44_APP_BASE_URL }),
	}
}


export const appParams = {
	...getAppParams()
};

/** Dummy user for dev: any OTP (4+ digits) on OTPVerification will mark verified and use this role. */
const dummyUser = {
	email: 'dummy@test.com',
	full_name: 'Test User',
	phone: '+1 234 567 8900',
	app_role: 'provider',
	registration_completed: true,
	email_verified: false,
	is_approved: true,
};

/** Stub so pages that import base44 can load. Replace with real client when backend is connected. */
export const base44 = {
	auth: {
		me: () => Promise.resolve({ ...dummyUser }),
		isAuthenticated: () => Promise.resolve(true),
		redirectToLogin: (url) => { if (url && typeof window !== 'undefined' && window.location.pathname !== url) window.location.href = url; },
		updateMe: (payload) => {
			if (payload && typeof payload === 'object') Object.assign(dummyUser, payload);
			return Promise.resolve();
		},
		logout: () => Promise.resolve(),
	},
	appLogs: {
		logUserInApp: (_pageName) => Promise.resolve(),
	},
	integrations: {
		Core: {
			InvokeLLM: () => Promise.resolve({ urgency: 'medium', estimated_hours: 24, explanation: '' }),
			UploadFile: () => Promise.resolve({ file_url: '' }),
		},
	},
	entities: {
		FoodDonation: {
			create: () => Promise.resolve(),
			filter: () => Promise.resolve([]),
			list: () => Promise.resolve([]),
			update: () => Promise.resolve(),
		},
		User: {
			list: () => Promise.resolve([]),
			update: () => Promise.resolve(),
		},
		FraudAlert: {
			list: () => Promise.resolve([]),
			filter: () => Promise.resolve([]),
			update: () => Promise.resolve(),
		},
		Notification: {
			filter: () => Promise.resolve([]),
			update: () => Promise.resolve(),
		},
		Rating: {
			filter: () => Promise.resolve([]),
			create: () => Promise.resolve(),
		},
	},
};
