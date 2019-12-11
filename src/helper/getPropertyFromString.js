export default function getPropertyFromString(obj, keyToken) {
	const keyArr = keyToken.split(".");
	return keyArr.reduce((subLevelProperty, key) => {
		try {
			return subLevelProperty[key];
		} catch (error) {
			return undefined;
		}
	}, obj);
}
