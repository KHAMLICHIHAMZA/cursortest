/**
 * Stub pour react-native-webview sur web
 * WebView n'est pas supporté sur la plateforme web
 */

import { View, Text } from 'react-native';

// Export un composant stub qui affiche un message
export default function WebViewStub(props) {
  return (
    <View style={{ padding: 16, backgroundColor: '#F5F5F5', borderRadius: 8 }}>
      <Text style={{ color: '#666', textAlign: 'center' }}>
        WebView is not supported on web platform
      </Text>
    </View>
  );
}

// Export les autres exports attendus
export const WebView = WebViewStub;




