import { View, Text, FlatList } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getSavedPosts, likeVideo, searchLikedPosts } from '../../lib/appwrite';
import useAppwrite from '../../lib/useAppwrite';
import EmptyState from '../../components/EmptyState';
import SearchInput from '../../components/SearchInput';
import VideoCard from '../../components/VideoCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '../../context/GlobalProvider';
import CustomButton from '../../components/CustomButton';

const Bookmark = () => {
  const { user } = useGlobalContext();

  const [filteredPosts, setFilteredPosts] = useState();

  const [searchText, setSearchText] = useState('');
  const {
    data: posts,
    refetch,
    loading,
  } = useAppwrite(() => getSavedPosts(user?.$id));

  const searchBookmarkedPosts = async () => {
    const regex = new RegExp(searchText, 'i'); // 'i' flag for case-insensitive search
    setFilteredPosts(posts.filter((item) => regex.test(item.title)));
  };

  useEffect(() => {
    refetch();
  }, []);

  return (
    <SafeAreaView className="bg-primary h-full">
      {loading && <Text>Loading</Text>}
      {!loading && (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => <VideoCard video={item} />}
          ListHeaderComponent={() => (
            <>
              <View className="flex my-6 px-4">
                <Text className="text-2xl font-psemibold text-white mt-1">
                  Saved Videos
                </Text>

                {/* <View className="mt-6 mb-8">
                  <SearchInput
                    localSearch={searchBookmarkedPosts}
                    setSearchText={setSearchText}
                  />
                </View> */}
              </View>
            </>
          )}
          ListEmptyComponent={() => (
            <EmptyState
              title="No Videos Found"
              subtitle="No videos found for this search query"
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default Bookmark;
