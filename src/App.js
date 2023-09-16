import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import { db, auth } from './firebase.js';
import { onSnapshot, collection, orderBy, query } from 'firebase/firestore';
import Header from './Header';
import Post from './Post';
import SidebarNotification from './SidebarNotification';
import Footer from './Footer';

function App() {
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [showSidebar, setShowSidebar] = useState(false);

    const postRefs = useRef({}); // Adicionado para guardar referências dos posts

    // useEffect para autenticação
    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(function (val) {
            if (val != null) {
                setUser(val.displayName);
                console.log("Logged user:", val.displayName); // Log para verificar usuário
            }
        });

        return () => unsubscribeAuth();
    }, []);

    // useEffect para buscar posts
    useEffect(() => {
        const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));

        const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
            const allPosts = snapshot.docs.map((doc) => ({
                id: doc.id,
                info: doc.data()
            }));
            setPosts(allPosts);

            if (user && allPosts.some(post => post.info.userName === user)) {
                console.log("Posts found for user:", user); // Log para verificar se posts do usuário foram encontrados
                setShowSidebar(true);
            }
        });

        return () => unsubscribePosts();
    }, [user]);

    return (
        <div className="App">
            <Header setUser={setUser} user={user} />
            {showSidebar && <SidebarNotification userName={user} postRefs={postRefs} />} {/* Passando postRefs para SidebarNotification */}
            {posts.map(val => (
                <div ref={el => postRefs.current[val.id] = el} key={val.id}> {/* Guardando referência do post */}
                    <Post user={user} info={val.info} id={val.id} />
                </div>
            ))}
            <Footer />
        </div>
    );
}

export default App;
