from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # This will enable CORS for all routes
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bookmarker.db'
db = SQLAlchemy(app)

class Bookmark(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(500), nullable=False)
    tags = db.relationship('Tag', backref='bookmark', lazy=True)
    date = db.Column(db.DateTime, default=datetime.utcnow)

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(50), nullable=False)
    bookmark_id = db.Column(db.Integer, db.ForeignKey('bookmark.id'), nullable=False)


@app.route('/bookmark', methods=['POST'])
def bookmark_page():
    data = request.json
    url = data['url']
    new_bookmark = Bookmark(url=url)
    db.session.add(new_bookmark)
    db.session.commit()
    return jsonify(message="Bookmark added"), 200


@app.route('/')
def index():
    tag_query = request.args.get('tag')
    bookmarks = Bookmark.query.order_by(Bookmark.date.desc()).all()  # Order by date, descending

    if tag_query:
        bookmarks = [bookmark for bookmark in bookmarks if
                     tag_query.lower() in [tag.text.lower() for tag in bookmark.tags]]

    for bookmark in bookmarks:
        bookmark.tags_list = ', '.join([tag.text for tag in bookmark.tags])

    return render_template('index.html', bookmarks=bookmarks)


@app.route('/add_tag')
def add_tag():
    bookmark_id = request.args.get('bookmarkId')
    tag_text = request.args.get('tagText')

    # Validate and sanitize input as necessary

    # Check if the tag already exists
    tag = Tag.query.filter_by(text=tag_text, bookmark_id=bookmark_id).first()
    if not tag:
        # If it doesn't exist, add it
        new_tag = Tag(text=tag_text, bookmark_id=bookmark_id)
        db.session.add(new_tag)
        db.session.commit()
        return jsonify(success="Tag added", tag_id=new_tag.id)

    # If it does exist, you might return the existing tag's info or a message
    return jsonify(info="Tag already exists", tag_id=tag.id)

@app.route('/remove_tag')
def remove_tag():
    bookmark_id = request.args.get('bookmarkId')
    tag_text = request.args.get('tagText')

    # Find and delete the specified tag
    tag = Tag.query.filter_by(bookmark_id=bookmark_id, text=tag_text).first()
    if tag:
        db.session.delete(tag)
        db.session.commit()
        return jsonify(success="Tag removed", tag_id=tag.id)
    else:
        return jsonify(error="Tag not found")

@app.route('/filter_bookmarks')
def filter_bookmarks():
    tag_query = request.args.get('tag')
    bookmarks = Bookmark.query.order_by(Bookmark.date.desc()).all()  # Order by date, descending

    if tag_query:
        bookmarks = [bookmark for bookmark in bookmarks if tag_query.lower() in [tag.text.lower() for tag in bookmark.tags]]

    bookmarks_json = [
        {
            'id': bookmark.id,
            'url': bookmark.url,
            'tags': ', '.join([tag.text for tag in bookmark.tags]),
            'date': bookmark.date.strftime('%Y-%m-%d')
        }
        for bookmark in bookmarks
    ]

    return jsonify(bookmarks_json)

@app.route('/delete_bookmark', methods=['DELETE'])
def delete_bookmark():
    bookmark_id = request.args.get('bookmarkId')
    
    # Find the bookmark by ID
    bookmark = Bookmark.query.get(bookmark_id)
    if bookmark:
        try:
            # Remove associated tags first
            Tag.query.filter_by(bookmark_id=bookmark.id).delete()
            
            # Delete the bookmark
            db.session.delete(bookmark)
            db.session.commit()
            return jsonify(success="Bookmark deleted")
        except Exception as e:
            db.session.rollback()
            return jsonify(error=str(e)), 500
    else:
        return jsonify(error="Bookmark not found"), 404


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
