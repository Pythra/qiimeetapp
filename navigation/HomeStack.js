import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Home from '../screens/Home/Home';
import MatchDetail from '../screens/Home/MatchDetail';
import PhotoGallery from '../screens/Home/PhotoGallery';
import BasicFilters from '../screens/Home/BasicFilters';
import LocationFilter from '../screens/Home/LocationFilter';
import LanguageFilter from '../screens/Home/LanguageFilter';
import AdvancedFilters from '../screens/Home/AdvancedFilters';
import RelationshipTypeFilter from '../screens/Home/RelationshipTypeFilter';
import LifestyleChoicesFilter from '../screens/Home/LifestyleChoicesFilter';
import EducationLevelFilter from '../screens/Home/EducationLevelFilter';
import ZodiacSignFilter from '../screens/Home/ZodiacSignFilter';
import FamilyPlanFilter from '../screens/Home/FamilyPlanFilter';
import PersonalityFilter from '../screens/Home/PersonalityFilter';
import ReligionFilter from '../screens/Home/ReligionFilter';
import ReportUser from '../screens/Home/ReportUser';
import ReportDetails from '../screens/Home/ReportDetails';  
const Stack = createStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: false,
        // Add this to eliminate all transition animations
        animationTypeForReplace: 'none',
        gestureEnabled: false,
        cardStyleInterpolator: () => ({
          cardStyle: { opacity: 1 },
        }),
      }}
    >
      <Stack.Screen name="HomeScreen" component={Home} />
      <Stack.Screen name="MatchDetail" component={MatchDetail} />
      <Stack.Screen name="PhotoGallery" component={PhotoGallery} />
      <Stack.Screen name="BasicFilters" component={BasicFilters} />
      <Stack.Screen name="LocationFilter" component={LocationFilter} />
      <Stack.Screen name="LanguageFilter" component={LanguageFilter} />
      <Stack.Screen name="AdvancedFilters" component={AdvancedFilters} />
      <Stack.Screen name="RelationshipType" component={RelationshipTypeFilter} />
      <Stack.Screen name="LifestyleChoices" component={LifestyleChoicesFilter} />
      <Stack.Screen name="EducationLevel" component={EducationLevelFilter} />
      <Stack.Screen name="ZodiacSign" component={ZodiacSignFilter} />
      <Stack.Screen name="FamilyPlan" component={FamilyPlanFilter} />
      <Stack.Screen name="PersonalityFilter" component={PersonalityFilter} />
      <Stack.Screen name="ReligionFilter" component={ReligionFilter} />
      <Stack.Screen name="ReportUser" component={ReportUser} />
      <Stack.Screen name="ReportDetails" component={ReportDetails} />
    </Stack.Navigator>
  );
};

export default HomeStack;
