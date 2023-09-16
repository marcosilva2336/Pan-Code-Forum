import React, { useEffect, useState } from 'react';
import { db, serverTimestamp } from './firebase';
import { collection, doc, onSnapshot, query, orderBy, addDoc, limit } from 'firebase/firestore';

function Post(props) {
    const [comentarios, setComentarios] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [newlyAddedUser, setNewlyAddedUser] = useState('');
    const [lastChecked, setLastChecked] = useState(localStorage.getItem('lastChecked') ? parseInt(localStorage.getItem('lastChecked')) : 0);

    const mostrarPopupParaNovoPost = (userName) => {
        setNewlyAddedUser(userName);
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 5000); // Hide popup after 5 seconds
    }

    useEffect(() => {
        const postCollection = collection(db, 'posts');
        const q = query(postCollection, orderBy('timestamp', 'desc'), limit(1));

        onSnapshot(q, (snapshot) => {
            const recentPost = snapshot.docs[0];
            if (recentPost) {
                const postTimestamp = recentPost.data().timestamp?.toDate().getTime();
                if (postTimestamp > lastChecked) {
                    mostrarPopupParaNovoPost(recentPost.data().userName);
                    setLastChecked(postTimestamp);
                    localStorage.setItem('lastChecked', postTimestamp.toString());
                }
            }
        });
    }, [lastChecked]);

    useEffect(() => {
        const postCollection = collection(db, 'posts');
        const q = query(postCollection, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(change => {
                if (change.type === "added") {
                    const newPostTimestamp = change.doc.data().timestamp?.toDate().getTime();
                    if (newPostTimestamp > lastChecked) {
                        mostrarPopupParaNovoPost(change.doc.data().userName);
                        setLastChecked(newPostTimestamp);
                        localStorage.setItem('lastChecked', newPostTimestamp.toString());
                    }
                }
            });
        });

        return () => {
            unsubscribe();
        };
    }, [lastChecked]);

    useEffect(() => {
        const postDocRef = doc(db, 'posts', props.id);
        const commentsCollection = collection(postDocRef, 'comentarios');
        const q = query(commentsCollection, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComentarios(snapshot.docs.map((doc) => ({
                id: doc.id,
                info: doc.data()
            })));
        });

        return () => {
            unsubscribe();
        };
    }, [props.id]);

    async function comentar(id, e) {
        e.preventDefault();
        let comentarioAtual = document.querySelector('#comentarios' + id).value;
        const docRef = doc(db, 'posts', id);
        const commentCollection = collection(docRef, 'comentarios');

        await addDoc(commentCollection, {
            nome: props.user,
            comentario: comentarioAtual,
            timestamp: serverTimestamp()
        });
        document.querySelector('#comentarios' + id).value = "";
    }

    return (
        <div className='postSingle'>
            {showPopup && (
                <div className="popup">
                    {newlyAddedUser} fez uma nova postagem!
                </div>
            )}
            
            <div className='postMain'>
                <img src={props.info.image} alt="Post image" />
                <p><b>{props.info.userName}</b>: {props.info.titulo}</p>
                <div className='coments'>
                    <h2>Últimos comentários:</h2>
                    {comentarios.map(val => (
                        <div key={val.id} className='coment-single'>
                            <p><b>{val.info.nome}</b>: {val.info.comentario}</p>
                        </div>
                    ))}
                </div>
                {(props.user) ?
                    <form onSubmit={(e) => comentar(props.id, e)}>
                        <textarea id={"comentarios" + props.id}></textarea>
                        <input type='submit' value="Comente" />
                    </form>
                    : null
                }
            </div>
        </div>
    );
}

export default Post;
