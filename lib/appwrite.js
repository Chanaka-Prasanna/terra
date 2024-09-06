import { Alert } from 'react-native';
import { Account, Avatars, Client,Databases,ID, Query,Storage } from 'react-native-appwrite';

export const config  = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform:'com.chanaka.terra',
    projectId:'66c2b5c5001327a5ce17',
    databaseId:'66c2b7b000016936131a',
    userCollectionId:'66c2b7ce0003a2042aaa',
    videoCollectionId:'66c2b7f1002900ef5a73',
    storageId:'66c2b9b40039e5f09ec8'

}

const {
endpoint,
platform,
projectId,
databaseId,
userCollectionId,
videoCollectionId,
storageId

} = config

// Init your React Native SDK
const client = new Client();

client
    .setEndpoint(config.endpoint) 
    .setProject(config.projectId) 
    .setPlatform(config.platform) 
;

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);
const storage = new Storage(client);

export const createUser=async (email,password,username)=>{

    try{

        const newAccount = await account.create(
            ID.unique(),
            email,
            password,
            username
        )

        if(!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(username)
        await signIn(email,password)

        const newUser = await databases.createDocument(
            databaseId,
            userCollectionId,
            ID.unique(),
            {
                accountId: newAccount.$id,
                email,
                username,
                avatar: avatarUrl

            }
        )

        return newUser
    }catch(error){
        console.log(error)
        throw new Error(error);
        
    }
}

export const signIn = async (email, password) => {
    try {
      // Check if there is already an active session
      const currentSession = await account.getSession('current');
      if (currentSession) {
        return currentSession; // Return the existing session
      }
    } catch (error) {
      // If there's no active session, proceed to create a new one
      console.log('No active session, proceeding with login');
    }
  
    try {
      // Create a new session if no session is active
      const session = await account.createEmailPasswordSession(email, password);
      return session;
    } catch (error) {
      console.error('Error during sign-in:', error);
      throw new Error(error);
    }
  };

export const getCurrentUser =async ()=>{
    try {
        const currentAccount = await account.get();

        if(!currentAccount) throw Error

        const currentUser = await databases.listDocuments(
            databaseId,
            userCollectionId,
            [Query.equal('accountId',currentAccount.$id)]
        )

        if(!currentUser) throw Error

        return currentUser.documents[0]
    } catch (error) {
        console.log(error);
        
    }
}

export const getAllPosts =async ()=>{
    try{
        const posts = await databases.listDocuments(
           databaseId,
           videoCollectionId,
           [Query.orderDesc('$createdAt')]
        )
        return posts.documents; 
        
    }catch(error){
        throw new Error(error)
    }
}


export const getLatestPosts =async ()=>{
    try{
        const posts = await databases.listDocuments(
           databaseId,
           videoCollectionId,
           [Query.orderDesc('$createdAt',Query.limit(7))]
        )
        return posts.documents; 
        
    }catch(error){
        throw new Error(error)
    }
}


export const  searchPosts=async (query)=> {
  console.log('Called general search')
    try {
      const posts = await databases.listDocuments(
        databaseId,
        videoCollectionId,
        [Query.search("title", query)]
      );
  
      if (!posts) throw new Error("Something went wrong");
  
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
  }
  


export const  getUserPosts= async (userId)=> {
    try {
      const posts = await databases.listDocuments(
        databaseId,
        videoCollectionId,
        [Query.equal("creater", userId)]
      );
  
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
}

// Sign Out
export const  signOut=async ()=> {
  try {
    const session = await account.deleteSession("current");

    return session;
  } catch (error) {
    throw new Error(error);
  }
}

export const getFilePreview=async(fileId, type)=> {
  let fileUrl;

  try {
    if (type === "video") {
      fileUrl = storage.getFileView(storageId, fileId);
    } else if (type === "image") {
      fileUrl = storage.getFilePreview(
        storageId,
        fileId,
        2000,
        2000,
        "top",
        100
      );
    } else {
      throw new Error("Invalid file type");
    }

    if (!fileUrl) throw Error;

    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

export const  uploadFile=async(file, type)=> {
  if (!file) return;

  const asset = {
    name: file.fileName,
    type: file.mimeType,
    size: file.fileSize,
    uri: file.uri,
};

  try {
    const uploadedFile = await storage.createFile(
      storageId,
      ID.unique(),
      asset
    );

    const fileUrl = await getFilePreview(uploadedFile.$id, type);
    return fileUrl;
  } catch (error) {
    throw new Error(error);
  }
}

export const  createVideo=async(form)=> {
  try {
    const [thumbnailUrl, videoUrl] = await Promise.all([
      uploadFile(form.thumbnail, "image"),
      uploadFile(form.video, "video"),
    ]);

    const newPost = await databases.createDocument(
      databaseId,
      videoCollectionId,
      ID.unique(),
      {
        title: form.title,
        thumbnail: thumbnailUrl,
        video: videoUrl,
        prompt: form.prompt,
        creater: form.userId,
      }
    );

    return newPost;
  } catch (error) {
    throw new Error(error);
  }
}


export const  likeVideo= async (userId,videoId)=> {

  try {
    const doc = await databases.getDocument(databaseId, videoCollectionId, videoId);
    const user_doc = await databases.getDocument(databaseId,userCollectionId,userId);
    const response_1= await databases.updateDocument(
      databaseId,
      videoCollectionId,
      videoId, 
      {
        likedBy: [...doc.likedBy,userId]
      }, 
  );


  // console.log(response_1.creater.liked_videos.map(item=>console.log(item.$id)));
  
    
    const result_2 = await databases.updateDocument(
      databaseId,
      userCollectionId,
      userId, 
      {
        liked_videos: [...user_doc.liked_videos,videoId]
      }, 
      
  );

    console.log(result_2.liked_videos)
  } catch (error) {
    throw new Error(error);
  }
}

export const  getSavedPosts= async (userId)=> {
  try {
    const result = await databases.getDocument(
      databaseId,
      userCollectionId,
      userId
      
  );
    return result.liked_videos
  } catch (error) {
    throw new Error(error);
  }
}
