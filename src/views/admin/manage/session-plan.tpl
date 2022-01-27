<label for="cid-{category.cid}-subject">
    Session subject:
</label>
<input id="cid-{category.cid}-subject" data-name="subject"
    placeholder="Subject of the class" value="{category.session_plan.subject}"
    class="form-control category_description subject" /><br />

<label for="cid-{category.cid}-session-description">
    Session description:
</label>
<input id="cid-{category.cid}-session-description" data-name="session-description"
    placeholder="Enter session description" value="{category.session_plan.description}"
    class="form-control category_description session-description" /><br />

<label for="cid-{category.cid}-session-order">
    Session order:
</label>
<input id="cid-{category.cid}-session-order" data-name="session-order"
    placeholder="Enter session order" value="{category.session_plan.order}"
    class="form-control category_order session-order" /><br />