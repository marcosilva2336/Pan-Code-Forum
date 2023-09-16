import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { query, collection, orderBy, limit, onSnapshot } from 'firebase/firestore';

function SidebarNotification({ postRefs }) { // userName removido das props
    const [recentPosts, setRecentPosts] = useState([]);

    useEffect(() => {
        // Modificando a query para pegar todos os posts, ordenados pela timestamp
        const userPostsQuery = query(
            collection(db, 'posts'),
            orderBy('timestamp', 'desc'),
            limit(5)
        );

        const unsubscribeRecentPosts = onSnapshot(userPostsQuery, (snapshot) => {
            const newPosts = snapshot.docs.map((doc) => ({
                id: doc.id,
                info: doc.data()
            }));
            setRecentPosts(newPosts);
        });

        return () => {
            unsubscribeRecentPosts();
        };
    }, []); // userName removido das dependências

    const scrollToPost = (postId) => {
        const postEl = postRefs.current[postId];
        if (postEl) {
            postEl.scrollIntoView({ behavior: "smooth" });
        }
    }

    return (
        <div className='sidebarNotification'>
            <div className='recentPosts'>
                <h3>Posts Recentes:</h3>
                {recentPosts.map(post => (
                    <div key={post.id} className='postCard' onClick={() => scrollToPost(post.id)}>
                        <img src={post.info.image} alt="Thumbnail" />
                        <p>{post.info.titulo}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default React.memo(SidebarNotification);
