import * as eva from '@eva-design/eva';
import * as fal from '@fal-ai/serverless-client';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { ApplicationProvider, useTheme } from '@ui-kitten/components';
import React from 'react';
import { appTheme } from '~/components/theme';
import { DrawingScreen } from '~/screens/drawing';
import { HomeScreen } from '~/screens/home';

const Drawer = createDrawerNavigator();

fal.config({
  proxyUrl: 'http://localhost:3333/api/fal/proxy',
});

function App() {
  return (
    <ApplicationProvider {...eva} theme={appTheme}>
      <Navigation />
    </ApplicationProvider>
  );
}

function Navigation() {
  const theme = useTheme();
  return (
    <NavigationContainer>
      <Drawer.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            // shadowColor: theme['border-basic-color-4'],
            backgroundColor: theme['background-basic-color-1'],
          },
          headerTitleStyle: {
            color: theme['text-basic-color'],
          },
          headerTintColor: theme['color-primary-500'],
          sceneContainerStyle: {
            backgroundColor: theme['background-basic-color-3'],
          },
          drawerStyle: {
            backgroundColor: theme['background-basic-color-1'],
          },
          drawerInactiveTintColor: theme['text-basic-color'],
          drawerActiveTintColor: theme['color-primary-500'],
        }}>
        <Drawer.Screen name="Home" component={HomeScreen} />
        <Drawer.Screen name="Drawing" component={DrawingScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default App;
